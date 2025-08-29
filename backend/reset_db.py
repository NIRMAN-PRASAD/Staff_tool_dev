# backend/reset_db.py

import sys
from app.database.base import Base
from app.database.session import engine

# IMPORTANT: You must import all your models here so that
# SQLAlchemy's Base class knows about them.
from app.database.models import user
from app.database.models import skill
from app.database.models import portfolio_department
from app.database.models import job
from app.database.models import candidate
from app.database.models import workflow_feedback
from app.database.models import settings

def reset_database():
    """
    Connects to the database, drops all tables, and creates them again.
    This is a destructive operation and will result in data loss.
    """
    print("--- DATABASE RESET SCRIPT ---")
    
    # Safety check to prevent accidental runs
    confirm = input("⚠️  WARNING: This will delete ALL data in the database. Are you sure? (y/N): ")
    if confirm.lower() != 'y':
        print("Aborted by user.")
        sys.exit()

    try:
        print("\nConnecting to the database...")
        # The engine is already configured in session.py to use your DATABASE_URL
        
        print("Dropping all existing tables...")
        Base.metadata.drop_all(bind=engine)
        print("Tables dropped successfully.")
        
        print("Creating all tables from models...")
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully.")
        
        print("\n✅ Database has been reset to a clean state.")

    except Exception as e:
        print(f"\n❌ An error occurred during the database reset: {e}")
        print("Please check your DATABASE_URL in the .env file and ensure the database server is running.")

if __name__ == "__main__":
    reset_database()