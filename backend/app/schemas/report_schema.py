from pydantic import BaseModel
from typing import List, Optional

# --- AAPKE EXISTING SCHEMAS (Inko waise hi rehne dein) ---
class DashboardStats(BaseModel):
    active_jobs: int
    applications_in_pipeline: int
    pending_approvals: int
    talent_pool: int

class JobStatusSummary(BaseModel):
    status: str
    count: int

class HiringPipelineStats(BaseModel):
    total_jobs: int
    open_jobs: int
    closed_jobs: int
    total_applications: int
    avg_time_to_hire_days: Optional[float] = None

# --- YEH MISSING SCHEMA ADD KARO ---
# Aapka reports.py file is class ko dhoondh raha hai, isliye error aa raha tha.
# Hum isse yahan add kar rahe hain taaki error fix ho jaaye.
class OverallStats(BaseModel):
    """
    A schema to hold overall summary statistics for the dashboard/reports.
    """
    total_portfolios: int
    total_departments: int
    total_open_jobs: int
    total_candidates: int
    applications_today: int

    class Config:
        from_attributes = True