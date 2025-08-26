# backend/app/database/models/workflow_feedback.py

from sqlalchemy import Column, Integer, String, TIMESTAMP, Text, ForeignKey, JSON, text
from sqlalchemy.orm import relationship
from app.database.base import Base

# <-- YEH NAYI TABLE HAI CUSTOM INTERVIEW STAGES KE LIYE -->
class InterviewStageTemplate(Base):
    __tablename__ = "InterviewStageTemplates"
    StageID = Column(Integer, primary_key=True, index=True)
    JobID = Column(Integer, ForeignKey("JobPostings.JobID"), nullable=False)
    StageName = Column(String(255), nullable=False)
    InterviewerInfo = Column(String(255), nullable=True) # e.g., "John Doe - Tech Lead"
    Sequence = Column(Integer, nullable=False) # To define order (1, 2, 3...)
    
    # Yeh relationship batata hai ki yeh stage kis job se belong karta hai
    job = relationship("JobPosting", back_populates="interview_stages")

# --- Purane Models Waise hi rahenge ---
# Inka use hum aage advanced feedback system ke liye kar sakte hain.

class FeedbackTemplate(Base):
    __tablename__ = "FeedbackTemplates"
    TemplateID = Column(Integer, primary_key=True, index=True)
    TemplateName = Column(String(255), nullable=False)
    Sections = Column(JSON)
    CreatedAt = Column(TIMESTAMP, server_default=text('now()'))
    CreatedBy = Column(Integer, ForeignKey("Users.UserID"))
    UpdatedAt = Column(TIMESTAMP)
    UpdatedBy = Column(Integer, ForeignKey("Users.UserID"))

class InterviewPanel(Base):
    __tablename__ = "InterviewPanels"
    PanelID = Column(Integer, primary_key=True, index=True)
    PanelName = Column(String(255), nullable=False)
    CreatedAt = Column(TIMESTAMP, server_default=text('now()'))
    CreatedBy = Column(Integer, ForeignKey("Users.UserID"))
    UpdatedAt = Column(TIMESTAMP)
    UpdatedBy = Column(Integer, ForeignKey("Users.UserID"))

class InterviewPanelMember(Base):
    __tablename__ = "InterviewPanelMembers"
    PanelID = Column(Integer, ForeignKey("InterviewPanels.PanelID"), primary_key=True)
    UserID = Column(Integer, ForeignKey("Users.UserID"), primary_key=True)

class InterviewWorkflow(Base):
    __tablename__ = "InterviewWorkflows"
    WorkflowID = Column(Integer, primary_key=True, index=True)
    JobID = Column(Integer, ForeignKey("JobPostings.JobID"))
    StageName = Column(String(255), nullable=False)
    Sequence = Column(Integer)
    PanelID = Column(Integer, ForeignKey("InterviewPanels.PanelID"))
    TemplateID = Column(Integer, ForeignKey("FeedbackTemplates.TemplateID"))
    CreatedAt = Column(TIMESTAMP, server_default=text('now()'))
    CreatedBy = Column(Integer, ForeignKey("Users.UserID"))
    UpdatedAt = Column(TIMESTAMP)
    UpdatedBy = Column(Integer, ForeignKey("Users.UserID"))

class ApplicationStageLog(Base):
    __tablename__ = "ApplicationStageLog"
    LogID = Column(Integer, primary_key=True, index=True)
    ApplicationID = Column(Integer, ForeignKey("JobApplications.ApplicationID"), nullable=False)
    WorkflowID = Column(Integer, ForeignKey("InterviewWorkflows.WorkflowID"))
    Status = Column(String(50), nullable=False)
    AssigneeUserID = Column(Integer, ForeignKey("Users.UserID"))
    AssignorUserID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    OutcomeRecommendation = Column(String(50))
    Notes = Column(Text)
    ScheduledAt = Column(TIMESTAMP)
    CreatedAt = Column(TIMESTAMP, server_default=text('now()'))
    UpdatedAt = Column(TIMESTAMP)

class InterviewFeedback(Base):
    __tablename__ = "InterviewFeedback"
    FeedbackID = Column(Integer, primary_key=True, index=True)
    LogID = Column(Integer, ForeignKey("ApplicationStageLog.LogID"), unique=True, nullable=False)
    ApplicationID = Column(Integer, ForeignKey("JobApplications.ApplicationID"), nullable=False)
    WorkflowID = Column(Integer, ForeignKey("InterviewWorkflows.WorkflowID"), nullable=False)
    InterviewerID = Column(Integer, ForeignKey("Users.UserID"), nullable=False)
    FeedbackData = Column(JSON)
    OverallRating = Column(Integer)
    Recommendation = Column(String(50))
    FeedbackDate = Column(TIMESTAMP)
    CreatedAt = Column(TIMESTAMP, server_default=text('now()'))
    CreatedBy = Column(Integer, ForeignKey("Users.UserID"))
    UpdatedAt = Column(TIMESTAMP)
    UpdatedBy = Column(Integer, ForeignKey("Users.UserID"))