# backend/app/schemas/candidate_schema.py

from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from datetime import datetime

# --- Candidate Schemas ---
class CandidateBase(BaseModel):
    FullName: str
    Email: EmailStr
    Phone: Optional[str] = None

class CandidateCreate(CandidateBase):
    pass

class Candidate(CandidateBase):
    CandidateID: int
    ResumeSummary: Optional[str] = None
    TechnicalSkillsSummary: Optional[str] = None
    CreatedAt: datetime

    class Config:
        from_attributes = True

# --- Job Application Schemas ---
class JobApplication(BaseModel):
    ApplicationID: int
    JobID: int
    CandidateID: int
    MatchScore: Optional[float] = None
    ScoreDetails: Optional[Dict[str, float]] = None
    Stage: str
    AppliedAt: datetime

    class Config:
        from_attributes = True

# --- Stage Assignment Schemas ---
class AssignStage(BaseModel):
    WorkflowID: int
    AssigneeUserID: int
    AssignorUserID: int
    ScheduledAt: Optional[datetime] = None
    Notes: Optional[str] = None

# --- Stage Log/History Schemas ---
class ApplicationStageLog(BaseModel):
    LogID: int
    Status: str
    OutcomeRecommendation: Optional[str] = None
    Notes: Optional[str] = None
    AssigneeUserID: Optional[int] = None
    AssignorUserID: int
    CreatedAt: datetime
    
    class Config:
        from_attributes = True

# --- Bulk Upload Result Schemas ---
class FailedUpload(BaseModel):
    filename: str
    error: str

class BulkUploadResult(BaseModel):
    successful_uploads: List[JobApplication]
    failed_uploads: List[FailedUpload]

    class Config:
        from_attributes = True

# <-- YEH NAYE SCHEMAS HAIN JINHE ADD KARNA HAI -->

# For AI Insights endpoint
class CandidateInsights(BaseModel):
    summary: str
    strengths: List[str]
    weaknesses: List[str]
    interview_questions: List[str]

# For updating application stage
class UpdateStage(BaseModel):
    stage: str