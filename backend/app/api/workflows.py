# backend/app/api/workflows.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.models import workflow_feedback as wf_model, user as user_model
from app.schemas import workflow_schema
from app.api.dependencies import get_db, get_current_active_user

router = APIRouter(
    prefix="/workflows",
    tags=["Interview Workflows"],
)

@router.get("/job/{job_id}/stages", response_model=List[workflow_schema.StageTemplate])
def get_stages_for_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_active_user)
):
    """
    Retrieves all custom interview stages defined for a specific job.
    """
    stages = db.query(wf_model.InterviewStageTemplate).filter(
        wf_model.InterviewStageTemplate.JobID == job_id
    ).order_by(wf_model.InterviewStageTemplate.Sequence).all()
    
    if not stages:
        # It's okay if a job has no stages defined yet, return an empty list.
        return []
        
    return stages