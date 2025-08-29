# backend/app/database/models/job.py

from sqlalchemy import Column, Integer, String, TIMESTAMP, Text, ForeignKey, text
from sqlalchemy.orm import relationship
from app.database.base import Base
from app.database.models.skill import JobRequiredSkill # <-- Association table import
from typing import Optional
class JobPosting(Base):
    __tablename__ = "JobPostings"
    JobID = Column(Integer, primary_key=True, index=True)
    JobTitle = Column(String(255), nullable=False)
    Description = Column(Text)
    DepartmentID = Column(Integer, ForeignKey("Departments.DepartmentID"))
    PortfolioID = Column(Integer, ForeignKey("Portfolios.PortfolioID"))
    Status = Column(String(50))
    ExperienceRequired = Column(String(100), nullable=True)
    JobType = Column(String(50), nullable=True)
    Location = Column(String(255), nullable=True) 
    department = relationship("Department")
    portfolio = relationship("Portfolio")
    required_skills = relationship("Skill", secondary=JobRequiredSkill, back_populates="jobs")

    # Yeh batata hai ki ek job ke andar multiple interview stages ho sakte hain
    interview_stages = relationship("InterviewStageTemplate", back_populates="job", cascade="all, delete-orphan")
    
    CreatedAt = Column(TIMESTAMP, server_default=text('now()'))
    CreatedBy = Column(Integer, ForeignKey("Users.UserID"))
    UpdatedAt = Column(TIMESTAMP)
    UpdatedBy = Column(Integer, ForeignKey("Users.UserID"))