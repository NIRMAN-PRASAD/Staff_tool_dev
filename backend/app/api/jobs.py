# backend/app/api/jobs.py

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
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
    """
    Generates a job description using AI based on a title, skills, and experience.
    """
    if current_user.Role not in ["Admin", "HR"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied.")
    try:
        result = gemini_service.generate_job_description(
            title=request.title,
            skills=request.skills,
            experience=request.experience
        )
        return result
    except Exception as e:
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


@router.get("/{job_id}", response_model=job_schema.Job)
def read_job(job_id: int, db: Session = Depends(get_db), current_user: user_model.User = Depends(get_current_active_user)):
    db_job = db.query(job_model.JobPosting).filter(job_model.JobPosting.JobID == job_id).first()
    if db_job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return db_job


@router.get("/{job_id}/applications", response_model=List[candidate_schema.JobApplication])
def read_applications_for_job(job_id: int, stage: Optional[str] = None, db: Session = Depends(get_db), current_user: user_model.User = Depends(get_current_active_user)):
    db_job = db.query(job_model.JobPosting).filter(job_model.JobPosting.JobID == job_id).first()
    if not db_job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    query = db.query(candidate_model.JobApplication).filter(candidate_model.JobApplication.JobID == job_id)
    if stage:
        query = query.filter(candidate_model.JobApplication.Stage == stage)
    applications = query.order_by(candidate_model.JobApplication.MatchScore.desc()).all()
    return applications