# seed_db.py

from sqlalchemy.orm import Session
from datetime import datetime

from app.database.session import SessionLocal, engine
from app.database.base import Base

# --- Correct Import Order ---
from app.database.models.user import User
from app.database.models.skill import Skill
from app.database.models.portfolio_department import Department, Portfolio
from app.database.models.job import JobPosting
from app.database.models.candidate import Candidate, CandidateSkill, JobApplication
from app.database.models.workflow_feedback import (
    FeedbackTemplate, InterviewPanel, InterviewPanelMember, 
    InterviewWorkflow, ApplicationStageLog, InterviewFeedback
)


def seed_database():
    """
    Resets the database and populates it with a complete set of test data,
    including a sample candidate and application.
    """
    db: Session = SessionLocal()

    try:
        print("--- Resetting Database ---")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        print("Database reset successfully.")

        print("\n--- Seeding Data ---")

        # 1. Create Users
        user1 = User(UserName="Admin User", Email="admin@example.com", Role="Admin")
        user2 = User(UserName="Recruiter Sam", Email="sam@example.com", Role="Recruiter")
        db.add_all([user1, user2])
        db.commit()
        print(f"Created {db.query(User).count()} users.")

        # 2. Create Departments
        dept1 = Department(DepartmentName="Engineering", CreatedBy=user1.UserID)
        db.add(dept1)
        db.commit()
        print(f"Created {db.query(Department).count()} departments.")

        # 3. Create Portfolios
        port1 = Portfolio(PortfolioName="Cloud Services", DepartmentID=dept1.DepartmentID, CreatedBy=user1.UserID)
        db.add(port1)
        db.commit()
        print(f"Created {db.query(Portfolio).count()} portfolios.")

        # 4. Create Jobs
        job1 = JobPosting(JobTitle="AI Engineer", Description="Seeking a talented AI Engineer...", DepartmentID=dept1.DepartmentID, PortfolioID=port1.PortfolioID, Status="Open", CreatedBy=user2.UserID)
        db.add(job1)
        db.commit()
        print(f"Created {db.query(JobPosting).count()} jobs.")
        
        # 5. Create Interview Workflow Stage
        workflow1 = InterviewWorkflow(JobID=job1.JobID, StageName="HR Screening", Sequence=1, CreatedBy=user1.UserID)
        db.add(workflow1)
        db.commit()
        print(f"Created {db.query(InterviewWorkflow).count()} workflow stage.")
        
        # V--- THIS IS THE NEW, CRUCIAL SECTION ---V
        # 6. Create a sample Candidate and a Job Application
        print("\n--- Seeding Sample Candidate and Application ---")
        candidate1 = Candidate(
            FullName="Jane Doe",
            Email="jane.doe@example.com",
            ResumeSummary="Experienced Python developer with a background in machine learning.",
            TechnicalSkillsSummary="Python, TensorFlow, AWS"
        )
        db.add(candidate1)
        db.commit() # Commit to get the candidate1.CandidateID
        print(f"Created {db.query(Candidate).count()} candidate.")

        application1 = JobApplication(
            CandidateID=candidate1.CandidateID,
            JobID=job1.JobID,
            Stage="Applied",
            MatchScore=85.0,
            AppliedAt=datetime.utcnow(),
            CreatedBy=user2.UserID
        )
        db.add(application1)
        db.commit()
        print(f"Created {db.query(JobApplication).count()} job application with ApplicationID: {application1.ApplicationID}")
        # --- END OF NEW SECTION ---

        print("\n--- Seeding Complete ---")

    except Exception as e:
        print(f"\nAN ERROR OCCURRED DURING SEEDING: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()