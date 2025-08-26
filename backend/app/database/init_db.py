# backend/app/database/init_db.py

from app.database.base import Base
from app.database.session import engine

# --- YAHAN IMPORT ORDER THEEK KIYA GAYA HAI ---
# Step 1: Independent tables (jo kisi par depend nahi karti)
from app.database.models.user import User
from app.database.models.skill import Skill
from app.database.models.portfolio_department import Department, Portfolio

# Step 2: Dependent tables
from app.database.models.job import JobPosting # Depends on User, Department, Portfolio
from app.database.models.candidate import Candidate, JobApplication # Depends on User, Job

# Step 3: Linker/Association tables and other complex models
# (skill.py se CandidateSkill ko alag se import karne ki zaroorat nahi,
# kyunki Skill model import hone par woh bhi register ho jaata hai)
from app.database.models.skill import CandidateSkill, JobRequiredSkill

from app.database.models.workflow_feedback import (
    FeedbackTemplate,
    InterviewPanel,
    InterviewPanelMember,
    InterviewWorkflow,
    ApplicationStageLog,
    InterviewFeedback,
    InterviewStageTemplate, # Depends on Job
)

def create_database_tables():
    """
    Connects to the database and creates all tables defined in the models.
    """
    print("Connecting to the database to create tables...")
    
    # WARNING: This will delete ALL data. Comment out drop_all to preserve data.
    print("Dropping all existing tables...")
    Base.metadata.drop_all(bind=engine)
    
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    print("Tables created successfully!")

if __name__ == "__main__":
    create_database_tables()