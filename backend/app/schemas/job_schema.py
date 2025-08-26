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