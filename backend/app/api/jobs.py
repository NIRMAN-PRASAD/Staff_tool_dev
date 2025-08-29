# backend/app/api/jobs.py

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session , selectinload
from sqlalchemy import func
from typing import List, Optional, Dict
from datetime import datetime

# Import models, schemas, and dependencies
from app.database.models import (
    job as job_model, 
    user as user_model, 
    skill as skill_model, 
    workflow_feedback as wf_model,
    candidate as candidate_model
)
from app.schemas import job_schema, candidate_schema
from app.api.dependencies import get_db, get_current_active_user
from app.services import gemini_service, resume_parser_service

router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"],
)

@router.post("/", response_model=job_schema.Job, status_code=status.HTTP_201_CREATED)
def create_job(
    job: job_schema.JobCreate,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_active_user)
):
    """
    Create a new job posting, along with its required skills and interview stages.
    """
    if current_user.Role not in ["Admin", "HR"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied.")

    try:
        job_data = job.model_dump(exclude={"required_skills", "interview_stages"})
        db_job = job_model.JobPosting(**job_data, CreatedBy=current_user.UserID)
        db.add(db_job)
        db.flush()

        if job.required_skills:
            skill_names = set(s.strip().title() for s in job.required_skills if s.strip())
            for skill_name in skill_names:
                db_skill = db.query(skill_model.Skill).filter(skill_model.Skill.SkillName.ilike(skill_name)).first()
                if not db_skill:
                    db_skill = skill_model.Skill(SkillName=skill_name, CreatedBy=current_user.UserID)
                    db.add(db_skill)
                    db.flush()
                db_job.required_skills.append(db_skill)
        
        if job.interview_stages:
            for stage_data in job.interview_stages:
                db_stage = wf_model.InterviewStageTemplate(
                    JobID=db_job.JobID,
                    StageName=stage_data.StageName,
                    InterviewerInfo=stage_data.InterviewerInfo,
                    Sequence=stage_data.Sequence
                )
                db.add(db_stage)

        db.commit()
        db.refresh(db_job)
        return db_job
    except Exception as e:
        db.rollback()
        print(f"Error creating job: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create job: An internal error occurred.")


@router.post("/generate-jd", response_model=Dict[str, str])
def generate_jd_with_ai(
    request: job_schema.JDGenerationRequest,
    current_user: user_model.User = Depends(get_current_active_user)
):
    if current_user.Role not in ["Admin", "HR"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied.")
    
    try:
        # --- ADD THIS PRINT STATEMENT ---
        print(f"--- [DEBUG] Calling Gemini for JD generation with title: {request.title} ---")
        
        result = gemini_service.generate_job_description(
            title=request.title,
            skills=request.skills,
            experience=request.experience
        )
        
        # --- ADD THIS PRINT STATEMENT ---
        print(f"--- [DEBUG] Gemini returned a result: {result} ---")
        
        return result
    except Exception as e:
        # --- ADD THIS PRINT STATEMENT ---
        print(f"--- [DEBUG] An exception occurred in /generate-jd: {e} ---")
        
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/parse-jd", response_model=Dict[str, str])
async def parse_jd_from_file(
    file: UploadFile = File(...),
    current_user: user_model.User = Depends(get_current_active_user)
):
    """
    Parses a JD from an uploaded file (PDF or DOCX) and returns the text.
    """
    if current_user.Role not in ["Admin", "HR"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied.")
    
    try:
        content = await file.read()
        text = resume_parser_service.extract_text(content, file.filename)
        return {"description": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse file: {str(e)}")


@router.get("/", response_model=List[job_schema.Job])
def read_jobs(
    department_id: Optional[int] = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: user_model.User = Depends(get_current_active_user)
):
    """
    Retrieves a list of jobs. Can be filtered by department_id.
    """
    query = db.query(job_model.JobPosting)

    if department_id is not None:
        query = query.filter(job_model.JobPosting.DepartmentID == department_id)

    jobs = query.offset(skip).limit(limit).all()
    return jobs


@router.get("/{job_id}", response_model=job_schema.JobDetails)
def read_job_details(job_id: int, db: Session = Depends(get_db), current_user: user_model.User = Depends(get_current_active_user)):
    """
    Retrieves a detailed overview of a single job, including its pipeline statistics.
    This endpoint powers the "Job Management" detail view.
    """
    # Step 1: Query the job and eagerly load related data to avoid extra DB calls
    db_job = db.query(job_model.JobPosting).options(
        selectinload(job_model.JobPosting.department),
        selectinload(job_model.JobPosting.portfolio),
        selectinload(job_model.JobPosting.required_skills),
        selectinload(job_model.JobPosting.interview_stages)
    ).filter(job_model.JobPosting.JobID == job_id).first()

    if db_job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    # Step 2: Calculate the candidate pipeline statistics (AC2)
    stage_counts = db.query(
        candidate_model.JobApplication.Stage, 
        func.count(candidate_model.JobApplication.Stage)
    ).filter(
        candidate_model.JobApplication.JobID == job_id
    ).group_by(
        candidate_model.JobApplication.Stage
    ).all()

    # Step 3: Format the stats into the Pydantic model structure
    stats = {
        "total_applications": 0,
        "shortlisted": 0,
        "pending_review": 0, # Assuming "Pending Review" is a stage
        "rejected": 0 # Assuming "Rejected" or "Not a Fit" is a stage
    }
    
    total_apps = 0
    for stage, count in stage_counts:
        total_apps += count
        if stage == "Shortlisted":
            stats["shortlisted"] = count
        elif stage == "Pending Review":
            stats["pending_review"] = count
        elif stage in ["Rejected", "Not a Fit"]: # Handle multiple rejection-like statuses
            stats["rejected"] += count # Use += to combine them
    
    stats["total_applications"] = total_apps

    # Step 4: Assemble and return the final response object
    # Pydantic will automatically validate this against the JobDetails schema
    return {
        "JobID": db_job.JobID,
        "JobTitle": db_job.JobTitle,
        "department": db_job.department,
        "portfolio": db_job.portfolio,
        "JobType": db_job.JobType,
        "Location": db_job.Location,
        "pipeline_stats": stats,
        "required_skills": db_job.required_skills,
        "interview_stages": db_job.interview_stages,
        "Description": db_job.Description
    }



@router.get("/{job_id}/applications", response_model=List[candidate_schema.ApplicationWithCandidateInfo])
def read_applications_for_job(job_id: int, stage: Optional[str] = None, db: Session = Depends(get_db), current_user: user_model.User = Depends(get_current_active_user)):
    db_job = db.query(job_model.JobPosting).filter(job_model.JobPosting.JobID == job_id).first()
    if not db_job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    query = db.query(candidate_model.JobApplication).options(
        selectinload(candidate_model.JobApplication.candidate)
    ).filter(candidate_model.JobApplication.JobID == job_id)
    
    if stage:
        query = query.filter(candidate_model.JobApplication.Stage == stage)
        
    applications = query.order_by(candidate_model.JobApplication.MatchScore.desc()).all()
    return applications