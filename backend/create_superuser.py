import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# --- Load environment variables ---
load_dotenv()

# Import the User model from your application structure
from app.database.models.user import User

def create_initial_admin_user():
    """
    Creates the first user with an 'Admin' role in the database.
    This user will log in via the standard OTP flow.
    This script should be run only once during the initial setup.
    """
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not found in .env file. Exiting.")
        return

    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    # Define the Admin User's Details
    # CHANGE THIS EMAIL to your actual email to receive OTP
    ADMIN_EMAIL = "nirmanprasad10r@gmail.com"
    ADMIN_USERNAME = "Main Admin"
    
    print("\nAttempting to create the initial admin user...")
    print(f"  - Email: {ADMIN_EMAIL}")
    print(f"  - Role:  Admin")

    try:
        # <-- YAHAN CHANGE KIYA GAYA HAI -->
        # user.email (lowercase) se User.Email (Capital E) kar diya hai
        existing_user = db.query(User).filter(User.Email == ADMIN_EMAIL).first()
        if existing_user:
            print(f"\n❌ SKIPPED: An admin user with the email '{ADMIN_EMAIL}' already exists in the database.")
            return

        # Create the new admin user object with correct column names
        db_user = User(
            UserName=ADMIN_USERNAME, 
            Email=ADMIN_EMAIL, 
            Role="Admin",
            IsActive=True
        )
        
        db.add(db_user)
        db.commit()
        
        print("\n✅ SUCCESS: Initial admin user created successfully.")
        print(f"You can now use the email '{ADMIN_EMAIL}' on the login page to request an OTP.")

    except Exception as e:
        print(f"\n❌ ERROR: An error occurred while creating the admin user: {e}")
        db.rollback()
    finally:
        db.close()
        print("\nDatabase connection closed.")


if __name__ == "__main__":
    create_initial_admin_user()