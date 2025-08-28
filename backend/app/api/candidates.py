# backend/app/api/candidates.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

# Import models, schemas, and dependencies
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

router = APIRouter(
    prefix="/candidates",
    tags=["Candidates & Applications"],
)

@router.post("/apply/{job_id}", response_model=candidate_schema.JobApplication, status_code=status.HTTP_201_CREATED)
async def upload_resume_and_create_application(
    job_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_active_user)
):
    """
    Handles the entire candidate application workflow for a single resume:
    1. Parses the resume text.
    2. Gets AI analysis (score, summary, skills).
    3. Creates or updates the candidate profile.
    4. Creates or updates skills in the main skills table.
    5. Links extracted skills to the candidate.
    6. Creates a job application record.
    """
    if current_user.Role not in ["Admin", "HR"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied.")

    db_job = db.query(job_model.JobPosting).filter(job_model.JobPosting.JobID == job_id).first()
    if not db_job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    try:
        resume_content = await file.read()
        resume_text = resume_parser_service.extract_text(resume_content, file.filename)
        ai_analysis = gemini_service.analyze_resume_with_job_desc(resume_text=resume_text, job_description=db_job.Description)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"File parsing or AI analysis failed: {e}")

    candidate_email = ai_analysis.get("extracted_email")
    if not candidate_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not extract email from resume.")

    db_candidate = db.query(candidate_model.Candidate).filter(candidate_model.Candidate.Email == candidate_email).first()

    try:
        # Step 1: Create or update candidate profile
        if not db_candidate:
            db_candidate = candidate_model.Candidate(
                FullName=ai_analysis.get("extracted_name", "N/A"),
                Email=candidate_email,
                ResumeSummary=ai_analysis.get("resume_summary"),
                TechnicalSkillsSummary=ai_analysis.get("technical_skills_summary"),
                CreatedBy=current_user.UserID
            )
            db.add(db_candidate)
            db.flush() # Flush to get CandidateID for linking skills
        else:
            db_candidate.ResumeSummary = ai_analysis.get("resume_summary")
            db_candidate.TechnicalSkillsSummary = ai_analysis.get("technical_skills_summary")
            db_candidate.UpdatedAt = datetime.utcnow()
            db_candidate.UpdatedBy = current_user.UserID

        # Step 2: Process and link extracted skills
        extracted_skills = ai_analysis.get("extracted_skills", [])
        if extracted_skills:
            # Clear existing skills for this candidate before adding new ones
            db.query(skill_model.CandidateSkill).filter(
                skill_model.CandidateSkill.CandidateID == db_candidate.CandidateID
            ).delete(synchronize_session=False)
            
            # Use a set to handle duplicate skills from the resume
            for skill_name in set(skill.strip().title() for skill in extracted_skills if skill.strip()):
                # Find skill in DB (case-insensitive)
                db_skill = db.query(skill_model.Skill).filter(skill_model.Skill.SkillName.ilike(skill_name)).first()
                
                # If skill doesn't exist in our main skill table, create it
                if not db_skill:
                    db_skill = skill_model.Skill(SkillName=skill_name, CreatedBy=current_user.UserID)
                    db.add(db_skill)
                    db.flush() # Flush to get the new SkillID
                
                # Link the candidate to the skill
                candidate_skill_link = skill_model.CandidateSkill(
                    CandidateID=db_candidate.CandidateID,
                    SkillID=db_skill.SkillID
                )
                db.add(candidate_skill_link)

        # Step 3: Create Job Application
        match_score = ai_analysis.get("match_score", 0.0)
        initial_stage = "Applied" if float(match_score) >= 50.0 else "Not a Fit"
        
        new_application = candidate_model.JobApplication(
            CandidateID=db_candidate.CandidateID,
            JobID=job_id,
            MatchScore=match_score,
            ScoreDetails=ai_analysis.get("score_details", {}),
            Stage=initial_stage,
            CreatedBy=current_user.UserID
        )
        db.add(new_application)
        
        db.commit()
        db.refresh(db_candidate)
        db.refresh(new_application)
        return new_application
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database transaction failed: {e}")


@router.get("/application/{application_id}/insights", response_model=candidate_schema.CandidateInsights)
def get_candidate_insights(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_active_user)
):
    application = db.query(candidate_model.JobApplication).filter(candidate_model.JobApplication.ApplicationID == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    candidate = db.query(candidate_model.Candidate).filter(candidate_model.Candidate.CandidateID == application.CandidateID).first()
    job = db.query(job_model.JobPosting).filter(job_model.JobPosting.JobID == application.JobID).first()

    if not candidate or not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated candidate or job not found")

    if not candidate.ResumeSummary or not job.Description:
        raise HTTPException(status_code=400, detail="Resume summary or job description is missing for analysis.")

    try:
        insights = gemini_service.get_ai_insights(
            resume_text=candidate.ResumeSummary,
            job_description=job.Description
        )
        return insights
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to get AI insights: {e}")


@router.patch("/application/{application_id}/stage", response_model=candidate_schema.JobApplication)
def update_application_stage(
    application_id: int,
    stage_update: candidate_schema.UpdateStage,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_active_user)
):
    if current_user.Role not in ["Admin", "HR"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission.")

    application = db.query(candidate_model.JobApplication).filter(candidate_model.JobApplication.ApplicationID == application_id).first()
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
    application_id: int, 
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_active_user)
):
    history = db.query(ApplicationStageLog).filter(
        ApplicationStageLog.ApplicationID == application_id
    ).order_by(ApplicationStageLog.CreatedAt.asc()).all()
    if not history:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application history not found")
    return history