# app/api/reports.py

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime
from typing import List
import io
import csv

from app.api.dependencies import get_db
from app.schemas import report_schema
from app.database.models import job as job_model
from app.database.models import candidate as candidate_model
from app.database.models.workflow_feedback import ApplicationStageLog

router = APIRouter(
    prefix="/reports",
    tags=["Reports & Analytics"],
)

# You may not have a report_schema.py file yet, so we can define the response
# model directly here for now to get it working.
class JobStatusSummary(report_schema.BaseModel):
    status: str
    count: int

@router.get("/summary", response_model=report_schema.OverallStats)
def get_overall_summary_stats(db: Session = Depends(get_db)):
    """
    Generates high-level summary statistics for the entire hiring pipeline.
    """
    job_stats = db.query(
        func.count(job_model.JobPosting.JobID).label("total_jobs"),
        func.sum(case((job_model.JobPosting.Status == 'Open', 1), else_=0)).label("open_jobs"),
        func.sum(case((job_model.JobPosting.Status == 'Closed', 1), else_=0)).label("closed_jobs")
    ).one()

    total_applications = db.query(candidate_model.JobApplication).count()

    # --- CORRECTED TIME-TO-HIRE CALCULATION ---
    # This method uses 'func.extract('epoch', ...)' which works on PostgreSQL.
    # We calculate the difference in seconds, then divide by (60 * 60 * 24) to get days.
    avg_seconds_to_hire = db.query(
        func.avg(
            func.extract('epoch', ApplicationStageLog.CreatedAt) - 
            func.extract('epoch', candidate_model.JobApplication.AppliedAt)
        )
    ).join(
        candidate_model.JobApplication, 
        ApplicationStageLog.ApplicationID == candidate_model.JobApplication.ApplicationID
    ).filter(
        candidate_model.JobApplication.Stage == 'Hired',
        ApplicationStageLog.Status == 'Hired' # Be more specific on the log entry
    ).scalar()

    avg_days_to_hire = None
    if avg_seconds_to_hire is not None:
        avg_days_to_hire = avg_seconds_to_hire / (60 * 60 * 24)

    return {
        "total_jobs": job_stats.total_jobs or 0,
        "open_jobs": job_stats.open_jobs or 0,
        "closed_jobs": job_stats.closed_jobs or 0,
        "total_applications": total_applications,
        "avg_time_to_hire_days": avg_days_to_hire
    }

@router.get("/jobs-by-status", response_model=List[JobStatusSummary])
def get_jobs_by_status(db: Session = Depends(get_db)):
    # ... (the code for this function) ...
    results = db.query(
        job_model.JobPosting.Status.label("status"),
        func.count(job_model.JobPosting.JobID).label("count")
    ).group_by(job_model.JobPosting.Status).all()
    return results

@router.get("/jobs/download-csv")
def download_job_report_csv(db: Session = Depends(get_db)):
    # ... (the code for this function) ...
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