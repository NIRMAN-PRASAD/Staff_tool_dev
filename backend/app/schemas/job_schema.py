# backend/app/schemas/job_schema.py

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Schemas ko unki dedicated files se import karna behtar practice hai
from .skill_schema import Skill
from .workflow_schema import StageTemplateCreate, StageTemplate

# --- Main Job Schemas ---

class JobCreate(BaseModel):
    """
    Schema for creating a new job. This is what the frontend will send.
    """
    JobTitle: str
    Description: Optional[str] = ""
    DepartmentID: int
    PortfolioID: int
    Status: str = "Open"
    
    # New fields for advanced job creation
    ExperienceRequired: str
    JobType: str
    required_skills: List[str] = [] # Frontend will send a list of skill names (strings)
    interview_stages: List[StageTemplateCreate] = []


class Job(BaseModel):
    """
    Schema for returning a job to the client. This includes DB-generated fields.
    """
    JobID: int
    JobTitle: str
    Description: Optional[str] = None
    DepartmentID: int
    PortfolioID: int
    Status: str
    
    # Response will include full objects for skills and stages
    ExperienceRequired: Optional[str] = None
    JobType: Optional[str] = None
    required_skills: List[Skill] = []
    interview_stages: List[StageTemplate] = []

    CreatedAt: datetime
    UpdatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Schema for AI Job Description Generation ---

class JDGenerationRequest(BaseModel):
    """
    Schema for the request body of the AI JD generation endpoint.
    """
    title: str
    skills: List[str]
    experience: str

class PipelineStats(BaseModel):
    """
    Schema for the high-level statistics cards. (AC2)
    """
    total_applications: int
    shortlisted: int
    pending_review: int
    rejected: int

class DepartmentInfo(BaseModel):
    """A lean schema for department info within a job."""
    DepartmentID: int
    DepartmentName: str

    class Config:
        from_attributes = True
        
class PortfolioInfo(BaseModel):
    """A lean schema for portfolio info within a job."""
    PortfolioID: int
    PortfolioName: str

    class Config:
        from_attributes = True

class JobDetails(BaseModel):
    """
    The main response model for the job detail page.
    This schema provides ALL data needed for the view in one call.
    """
    # AC1: Header Info
    JobID: int
    JobTitle: str
    
    # AC5: Job Details Card (with full objects, not just IDs)
    department: DepartmentInfo
    portfolio: PortfolioInfo
    JobType: Optional[str] = None
    Location: Optional[str] = None # Assuming you have this field in your model
    
    # AC2: High-Level Statistics
    pipeline_stats: PipelineStats
    
    # AC6: Required Skills
    required_skills: List[Skill] = []
    
    # AC7: Interview Rounds
    interview_stages: List[StageTemplate] = []
    
    # AC8: Job Description
    Description: Optional[str] = None
    
    class Config:
        from_attributes = True    

class Job(BaseModel):
    """
    Schema for returning a job to the client. This includes DB-generated fields.
    """
    JobID: int
    JobTitle: str
    Description: Optional[str] = None
    DepartmentID: int
    PortfolioID: int
    Status: str
    
    # Response will include full objects for skills and stages
    ExperienceRequired: Optional[str] = None
    JobType: Optional[str] = None
    
    # --- ADD THIS LINE ---
    Location: Optional[str] = None
    
    required_skills: List[Skill] = []
    interview_stages: List[StageTemplate] = []

    CreatedAt: datetime
    UpdatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True