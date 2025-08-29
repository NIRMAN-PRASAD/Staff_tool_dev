# backend/app/api/candidates.py

import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session, selectinload
from typing import List
from datetime import datetime
import zipfile
import io
from fastapi.responses import FileResponse

# Import all necessary modules
from app.database.models import (
    candidate as candidate_model, 
    job as job_model, 
    user as user_model, 
    skill as skill_model
)
from app.database.models.workflow_feedback import ApplicationStageLog
from app.schemas import candidate_schema
from app.api.dependencies import get_db, get_current_active_user
from app.services import gemini_service, resume_parser_service

# Define a directory to store uploaded resumes
RESUMES_DIR = "resumes"
os.makedirs(RESUMES_DIR, exist_ok=True) # Create the directory on startup if it doesn't exist

router = APIRouter(
    prefix="/candidates",
    tags=["Candidates & Applications"],
)

# --- REFACTORED HELPER FUNCTION (NOW INCLUDES FILE SAVING) ---
def _process_single_resume(
    resume_content: bytes, 
    filename: str, 
    db_job: job_model.JobPosting,
    current_user: user_model.User,
    db: Session
) -> candidate_schema.ApplicationWithCandidateInfo:
    """
    Processes a single resume, saves the file, analyzes it with AI, and
    updates the database in a single transaction. Reused by both single and bulk endpoints.
    """
    # 1. Parse resume text and get AI analysis
    resume_text = resume_parser_service.extract_text(resume_content, filename)
    ai_analysis = gemini_service.analyze_resume_with_job_desc(
        resume_text=resume_text, job_description=db_job.Description
    )
    
    candidate_email = ai_analysis.get("extracted_email")
    if not candidate_email:
        raise ValueError("Could not extract email from resume.")

    # 2. Save the original file to a persistent location
    unique_id = uuid.uuid4()
    safe_filename = "".join(c for c in filename if c.isalnum() or c in ('.', '_')).rstrip()
    unique_filename = f"{unique_id}_{safe_filename}"
    file_path = os.path.join(RESUMES_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(resume_content)

    # 3. Start a database transaction
    try:
        db_candidate = db.query(candidate_model.Candidate).filter_by(Email=candidate_email).first()
        
        if not db_candidate:
            db_candidate = candidate_model.Candidate(
                FullName=ai_analysis.get("extracted_name", "N/A"),
                Email=candidate_email,
                ResumeSummary=ai_analysis.get("resume_summary"),
                TechnicalSkillsSummary=ai_analysis.get("technical_skills_summary"),
                CreatedBy=current_user.UserID,
                ResumeFilePath=file_path # Store the file path
            )
            db.add(db_candidate)
            db.flush()
        else:
            db_candidate.ResumeSummary = ai_analysis.get("resume_summary")
            db_candidate.TechnicalSkillsSummary = ai_analysis.get("technical_skills_summary")
            db_candidate.UpdatedAt = datetime.utcnow()
            db_candidate.UpdatedBy = current_user.UserID
            db_candidate.ResumeFilePath = file_path # Update with the latest resume file path

        # 4. Process and link skills
        extracted_skills = ai_analysis.get("extracted_skills", [])
        if extracted_skills:
            db.query(skill_model.CandidateSkill).filter_by(CandidateID=db_candidate.CandidateID).delete(synchronize_session=False)
            for skill_name in set(s.strip().title() for s in extracted_skills if s.strip()):
                db_skill = db.query(skill_model.Skill).filter(skill_model.Skill.SkillName.ilike(skill_name)).first()
                if not db_skill:
                    db_skill = skill_model.Skill(SkillName=skill_name, CreatedBy=current_user.UserID)
                    db.add(db_skill)
                    db.flush()
                db.add(skill_model.CandidateSkill(CandidateID=db_candidate.CandidateID, SkillID=db_skill.SkillID))

        # 5. Create the Job Application record
        match_score = ai_analysis.get("match_score", 0.0)
        initial_stage = "Applied" if float(match_score) >= 50.0 else "Not a Fit"
        
        new_application = candidate_model.JobApplication(
            CandidateID=db_candidate.CandidateID,
            JobID=db_job.JobID,
            MatchScore=match_score,
            ScoreDetails=ai_analysis.get("score_details", {}),
            Stage=initial_stage,
            CreatedBy=current_user.UserID
        )
        db.add(new_application)
        db.commit()
        db.refresh(new_application)
        return new_application
    except Exception as e:
        db.rollback()
        # If the DB transaction fails, delete the file we just saved to avoid orphaned files
        if os.path.exists(file_path):
            os.remove(file_path)
        raise e

# --- ENDPOINTS ---

@router.post("/apply/{job_id}", response_model=candidate_schema.ApplicationWithCandidateInfo, status_code=status.HTTP_201_CREATED)
async def upload_resume_and_create_application(
    job_id: int, file: UploadFile = File(...), db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_active_user)
):
    if current_user.Role not in ["Admin", "HR"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied.")
    db_job = db.query(job_model.JobPosting).filter_by(JobID=job_id).first()
    if not db_job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    try:
        resume_content = await file.read()
        return _process_single_resume(resume_content, file.filename, db_job, current_user, db)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/bulk-apply/{job_id}", response_model=candidate_schema.BulkUploadResult)
async def bulk_upload_resumes(
    job_id: int, file: UploadFile = File(...), db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_active_user)
):
    if current_user.Role not in ["Admin", "HR"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied.")
    if file.content_type not in ["application/zip", "application/x-zip-compressed"]:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Invalid file type. Please upload a .zip file.")
    db_job = db.query(job_model.JobPosting).filter_by(JobID=job_id).first()
    if not db_job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    
    successful_uploads, failed_uploads = [], []
    zip_content = await file.read()
    
    with zipfile.ZipFile(io.BytesIO(zip_content)) as zip_file:
        for filename in zip_file.namelist():
            if filename.startswith('__MACOSX') or filename.endswith('/'):
                continue
            try:
                resume_content = zip_file.read(filename)
                new_application = _process_single_resume(resume_content, filename, db_job, current_user, db)
                successful_uploads.append(new_application)
            except Exception as e:
                failed_uploads.append({"filename": filename, "error": str(e)})
    
    return {"successful_uploads": successful_uploads, "failed_uploads": failed_uploads}

@router.get("/{candidate_id}/download-resume")
def download_resume(
    candidate_id: int, db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_active_user)
):
    candidate = db.query(candidate_model.Candidate).filter_by(CandidateID=candidate_id).first()
    if not candidate or not candidate.ResumeFilePath:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume file not found.")
    file_path = candidate.ResumeFilePath
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume file not found on server.")
    
    original_filename = "_".join(file_path.split("_")[1:]) or "resume"
    return FileResponse(path=file_path, filename=original_filename, media_type='application/octet-stream')

@router.get("/application/{application_id}/profile", response_model=candidate_schema.CandidateProfileResponse)
def get_application_profile(
    application_id: int, db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_active_user)
):
    application = db.query(candidate_model.JobApplication).options(
        selectinload(candidate_model.JobApplication.candidate),
        selectinload(candidate_model.JobApplication.job).selectinload(job_model.JobPosting.required_skills)
    ).filter(candidate_model.JobApplication.ApplicationID == application_id).first()

    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    candidate_skills = db.query(skill_model.Skill).join(skill_model.CandidateSkill).filter(
        skill_model.CandidateSkill.CandidateID == application.CandidateID
    ).all()

    job_required_skills = {skill.SkillName.lower() for skill in application.job.required_skills}
    candidate_skill_names = {skill.SkillName.lower() for skill in candidate_skills}
    matched_skill_names = job_required_skills.intersection(candidate_skill_names)
    matched_skills = [s for s in candidate_skills if s.SkillName.lower() in matched_skill_names]

    return {
        "application": application,
        "candidate": application.candidate,
        "job": application.job,
        "all_candidate_skills": candidate_skills,
        "matched_skills": matched_skills
    }

@router.get("/application/{application_id}/insights", response_model=candidate_schema.CandidateInsights)
def get_candidate_insights(
    application_id: int, db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_active_user)
):
    application = db.query(candidate_model.JobApplication).filter_by(ApplicationID=application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    candidate = db.query(candidate_model.Candidate).filter_by(CandidateID=application.CandidateID).first()
    job = db.query(job_model.JobPosting).filter_by(JobID=application.JobID).first()
    if not (candidate and job and candidate.ResumeSummary and job.Description):
        raise HTTPException(status_code=400, detail="Data missing for analysis.")
    try:
        return gemini_service.get_ai_insights(
            resume_summary=candidate.TechnicalSkillsSummary, job_description=job.Description
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get AI insights: {e}")

@router.patch("/application/{application_id}/stage", response_model=candidate_schema.JobApplication)
def update_application_stage(
    application_id: int, stage_update: candidate_schema.UpdateStage, db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_active_user)
):
    if current_user.Role not in ["Admin", "HR"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied.")
    application = db.query(candidate_model.JobApplication).filter_by(ApplicationID=application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    application.Stage = stage_update.stage
    application.UpdatedAt = datetime.utcnow()
    application.UpdatedBy = current_user.UserID
    db.commit()
    db.refresh(application)
    return application

@router.get("/application/{application_id}/history", response_model=List[candidate_schema.ApplicationStageLog])
def read_candidate_application_history(
    application_id: int, db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_active_user)
):
    history = db.query(ApplicationStageLog).filter_by(ApplicationID=application_id).order_by(ApplicationStageLog.CreatedAt.asc()).all()
    return history