# backend/app/database/models/candidate.py

from sqlalchemy import Column, Integer, String, TIMESTAMP, Text, ForeignKey, NUMERIC, text, JSON
from app.database.base import Base
from sqlalchemy.orm import relationship 
class Candidate(Base):
    __tablename__ = "Candidates"
    CandidateID = Column(Integer, primary_key=True, index=True)
    FullName = Column(String(255), nullable=False)
    Email = Column(String(255), unique=True, index=True)
    Phone = Column(String(50))
    ResumeLink = Column(Text)
    ResumeFilePath = Column(String, nullable=True)
    ExperienceYears = Column(NUMERIC)
    NoticePeriod = Column(Integer)
    NoticePeriodEndDate = Column(TIMESTAMP)
    Source = Column(String(50))
    ResumeSummary = Column(Text)
    TechnicalSkillsSummary = Column(Text)
    CreatedAt = Column(TIMESTAMP, server_default=text('now()'))
    CreatedBy = Column(Integer, ForeignKey("Users.UserID"))
    UpdatedAt = Column(TIMESTAMP)
    UpdatedBy = Column(Integer, ForeignKey("Users.UserID"))

# CandidateSkill model yahan se hata diya gaya hai kyunki woh ab skill.py mein hai.

class JobApplication(Base):
    __tablename__ = "JobApplications"
    candidate = relationship("Candidate")
    ApplicationID = Column(Integer, primary_key=True, index=True)
    CandidateID = Column(Integer, ForeignKey("Candidates.CandidateID"), nullable=False)
    job = relationship("JobPosting")
    JobID = Column(Integer, ForeignKey("JobPostings.JobID"), nullable=False)
    MatchScore = Column(NUMERIC)
    ScoreDetails = Column(JSON)
    Stage = Column(String(50))
    Notes = Column(Text)
    AppliedAt = Column(TIMESTAMP, server_default=text('now()'))
    CreatedBy = Column(Integer, ForeignKey("Users.UserID"))
    UpdatedAt = Column(TIMESTAMP)
    UpdatedBy = Column(Integer, ForeignKey("Users.UserID"))