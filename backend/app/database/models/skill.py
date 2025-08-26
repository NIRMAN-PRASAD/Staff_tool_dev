# backend/app/database/models/skill.py

from sqlalchemy import Column, Integer, String, TIMESTAMP, Text, ForeignKey, text, Table
from sqlalchemy.orm import relationship
from app.database.base import Base

# <-- YEH NAYI ASSOCIATION TABLE HAI -->
# Yeh table sirf Job ID aur Skill ID ko store karti hai, iska apna model class nahi hai.
JobRequiredSkill = Table('JobRequiredSkills', Base.metadata,
    Column('JobID', Integer, ForeignKey('JobPostings.JobID'), primary_key=True),
    Column('SkillID', Integer, ForeignKey('Skills.SkillID'), primary_key=True)
)

class Skill(Base):
    __tablename__ = "Skills"
    SkillID = Column(Integer, primary_key=True, index=True)
    SkillName = Column(String(255), unique=True, nullable=False, index=True)
    SkillCategory = Column(String(255))
    CreatedAt = Column(TIMESTAMP, server_default=text('now()'))
    CreatedBy = Column(Integer, ForeignKey("Users.UserID"))
    
    # <-- YEH RELATIONSHIP BATAATA HAI KI YEH SKILL KIN-KIN JOBS MEIN REQUIRED HAI -->
    jobs = relationship("JobPosting", secondary=JobRequiredSkill, back_populates="required_skills")

class CandidateSkill(Base):
    __tablename__ = "CandidateSkills"
    CandidateID = Column(Integer, ForeignKey("Candidates.CandidateID"), primary_key=True)
    SkillID = Column(Integer, ForeignKey("Skills.SkillID"), primary_key=True)
    SkillLevel = Column(String(50))
    Strengths = Column(Text)
    Gaps = Column(Text)