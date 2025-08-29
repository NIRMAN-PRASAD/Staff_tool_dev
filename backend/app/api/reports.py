# backend/app/api/reports.py

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime
from typing import List, Dict
import io
import csv

from app.api.dependencies import get_db, get_current_active_user
from app.schemas import report_schema
from app.database.models import job as job_model
from app.database.models import candidate as candidate_model
from app.database.models import user as user_model # <-- IMPORT USER MODEL
from app.database.models.workflow_feedback import ApplicationStageLog

router = APIRouter(
    prefix="/reports",
    tags=["Reports & Analytics"],
)


# --- THIS IS THE NEW ENDPOINT FOR THE DASHBOARD ---
@router.get("/dashboard-stats", response_model=Dict[str, int])
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_active_user)
):
    """
    Provides high-level statistics for the main dashboard.
    """
    total_jobs = db.query(func.count(job_model.JobPosting.JobID)).scalar()
    total_candidates = db.query(func.count(candidate_model.Candidate.CandidateID)).scalar()
    
    # Counts active users, you can refine this later to count only 'Interviewer' roles
    active_interviewers = db.query(func.count(user_model.User.UserID)).filter(user_model.User.IsActive == True).scalar()
    
    # Counts candidates in any stage that is not 'Applied' or 'Rejected'
    selected_candidates = db.query(func.count(candidate_model.JobApplication.ApplicationID)).filter(
        candidate_model.JobApplication.Stage.in_(['Shortlisted', 'Interview', 'Offer', 'Hired'])
    ).scalar()

    return {
        "total_jobs_posted": total_jobs or 0,
        "total_candidates": total_candidates or 0,
        "active_interviewers": active_interviewers or 0,
        "selected_candidates": selected_candidates or 0,
    }


# --- EXISTING FUNCTIONS (If you have them) ---

class JobStatusSummary(report_schema.BaseModel):
    status: str
    count: int

@router.get("/summary", response_model=report_schema.OverallStats)
def get_overall_summary_stats(db: Session = Depends(get_db)):
    # ... your existing code for this function ...
    pass

@router.get("/jobs-by-status", response_model=List[JobStatusSummary])
def get_jobs_by_status(db: Session = Depends(get_db)):
    results = db.query(
        job_model.JobPosting.Status.label("status"),
        func.count(job_model.JobPosting.JobID).label("count")
    ).group_by(job_model.JobPosting.Status).all()
    return results

@router.get("/jobs/download-csv")
def download_job_report_csv(db: Session = Depends(get_db)):
    output = io.StringIO()
    writer = csv.writer(output)
    header = ["JobID", "JobTitle", "Status", "DepartmentID", "PortfolioID", "CreatedAt"]
    writer.writerow(header)
    jobs = db.query(job_model.JobPosting).all()
    for job in jobs:
        writer.writerow([job.JobID, job.JobTitle, job.Status, job.DepartmentID, job.PortfolioID, job.CreatedAt])
    output.seek(0)
    return Response(
        content=output.read(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=job_report_{datetime.now().strftime('%Y-%m-%d')}.csv"}
    )