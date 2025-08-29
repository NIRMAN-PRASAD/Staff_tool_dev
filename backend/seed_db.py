# In backend/seed_db.py

from sqlalchemy.orm import Session
from datetime import datetime

from app.database.session import SessionLocal, engine
from app.database.base import Base

# Import all your models
from app.database.models import user, portfolio_department, skill, job, candidate, workflow_feedback

def seed_database():
    """
    Resets the database and populates it with a complete set of test data,
    perfect for testing the Job Details page.
    """
    db: Session = SessionLocal()

    try:
        print("--- Resetting Database ---")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        print("Database reset successfully.")

        print("\n--- Seeding Data ---")

        # 1. Create a User
        admin_user = user.User(UserName="Admin User", Email="admin@example.com", Role="Admin")
        db.add(admin_user)
        db.commit()

        # 2. Create Portfolio and Department
        portfolio1 = portfolio_department.Portfolio(PortfolioName="Concertiv", CreatedBy=admin_user.UserID)
        db.add(portfolio1)
        db.commit()

        dept1 = portfolio_department.Department(DepartmentName="Engineering", PortfolioID=portfolio1.PortfolioID, CreatedBy=admin_user.UserID)
        db.add(dept1)
        db.commit()
        
        # 3. Create Skills to be linked to the job
        skill_react = skill.Skill(SkillName="React", CreatedBy=admin_user.UserID)
        skill_ts = skill.Skill(SkillName="TypeScript", CreatedBy=admin_user.UserID)
        skill_gql = skill.Skill(SkillName="GraphQL", CreatedBy=admin_user.UserID)
        db.add_all([skill_react, skill_ts, skill_gql])
        db.commit()

        # 4. Create a comprehensive JobPosting (THIS IS THE KEY CHANGE)
        job1 = job.JobPosting(
            JobTitle="Senior Frontend Developer", 
            Description="Seeking a talented Senior Frontend Developer to join our team...", 
            DepartmentID=dept1.DepartmentID, 
            PortfolioID=portfolio1.PortfolioID, 
            Status="Open", 
            CreatedBy=admin_user.UserID,
            JobType="Full-Time", # <-- ADDED THIS
            Location="San Francisco, CA" # <-- ADDED THIS
        )
        # Link skills to the job
        job1.required_skills.extend([skill_react, skill_ts, skill_gql])
        db.add(job1)
        db.commit() # Commit to get JobID for the next steps
        print(f"Created Job with ID: {job1.JobID}")
        
        # 5. Create Interview Stages for the job
        stage1 = workflow_feedback.InterviewStageTemplate(JobID=job1.JobID, StageName="L1 - Technical Round", InterviewerInfo="John Smith - Senior Engineer", Sequence=1)
        stage2 = workflow_feedback.InterviewStageTemplate(JobID=job1.JobID, StageName="L2 - System Design", InterviewerInfo="Sarah Johnson - Tech Lead", Sequence=2)
        db.add_all([stage1, stage2])
        db.commit()
        
        # 6. Create Candidates and Job Applications with different stages
        candidates_to_create = [
            {"name": "Alice Shortlisted", "email": "alice@test.com", "stage": "Shortlisted"},
            {"name": "Bob Pending", "email": "bob@test.com", "stage": "Pending Review"},
            {"name": "Charlie Rejected", "email": "charlie@test.com", "stage": "Rejected"},
            {"name": "Diana Applied", "email": "diana@test.com", "stage": "Applied"},
        ]
        
        for cand_data in candidates_to_create:
            new_cand = candidate.Candidate(FullName=cand_data["name"], Email=cand_data["email"], CreatedBy=admin_user.UserID)
            db.add(new_cand)
            db.commit()

            new_app = candidate.JobApplication(
                CandidateID=new_cand.CandidateID,
                JobID=job1.JobID,
                Stage=cand_data["stage"],
                CreatedBy=admin_user.UserID
            )
            db.add(new_app)
        db.commit()
        print(f"Created {len(candidates_to_create)} candidates and applications.")

        print("\n--- Seeding Complete ---")

    except Exception as e:
        print(f"\nAN ERROR OCCURRED DURING SEEDING: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()