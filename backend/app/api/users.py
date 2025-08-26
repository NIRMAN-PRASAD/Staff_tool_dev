from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import List

# Import all necessary modules from your application
from app.database.models import user as user_model
from app.schemas import user_schema
from app.services import notification_service
from app.core import security
from app.api.dependencies import get_db, get_current_active_user

router = APIRouter(
    prefix="/users",
    tags=["Users & Authentication"],
)


# ====================================================================
# ADMIN-ONLY USER MANAGEMENT
# ====================================================================

@router.post("/", response_model=user_schema.User, status_code=status.HTTP_201_CREATED)
def create_user(
    user: user_schema.UserCreate, 
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_active_user)
):
    """
    Creates a new user and sends them a welcome email.
    Authorization: Only 'Admin' users can perform this action.
    """
    if current_user.Role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted. Admin access required."
        )

    db_user = db.query(user_model.User).filter(user_model.User.Email == user.Email).first()
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    db_user = user_model.User(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    notification_service.send_welcome_email(
        recipient_email=db_user.Email,
        user_name=db_user.UserName,
        user_role=db_user.Role
    )

    return db_user


@router.get("/", response_model=List[user_schema.User])
def read_users(
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_active_user)
):
    """
    Retrieves a list of all users.
    Authorization: Only 'Admin' users can access this.
    """
    if current_user.Role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have the permission to view users."
        )
    
    users = db.query(user_model.User).order_by(user_model.User.UserID).all()
    return users

# ... (baaki ke admin functions same rahenge)


# ====================================================================
# PASSWORDLESS OTP LOGIN FLOW
# ====================================================================

@router.post("/login/request-otp", status_code=status.HTTP_200_OK)
def request_login_otp(otp_request: user_schema.OtpRequest, db: Session = Depends(get_db)):
    """
    Step 1 of Passwordless Login: User provides an email to receive an OTP.
    """
    # <-- YAHAN CHANGE KIYA GAYA HAI -->
    # .email se .Email (Capital E) kiya gaya hai
    user = db.query(user_model.User).filter(user_model.User.Email == otp_request.email).first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User with this email not found.")
    
    if not user.IsActive:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User account is inactive.")

    otp = notification_service.generate_otp()
    expiry_time = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    user.OtpCode = otp
    user.OtpExpiry = expiry_time
    db.commit()

    success = notification_service.send_otp_email(user.Email, otp)
    if not success:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to send OTP email.")

    return {"message": f"An OTP has been sent to {otp_request.email}."}


@router.post("/login/verify-otp", response_model=user_schema.Token)
def verify_otp_and_get_token(otp_verify: user_schema.OtpVerify, db: Session = Depends(get_db)):
    """
    Step 2 of Passwordless Login: User submits the OTP to get a JWT token.
    """
    # <-- YAHAN BHI CHANGE KIYA GAYA HAI -->
    user = db.query(user_model.User).filter(user_model.User.Email == otp_verify.email).first()

    if not user or not user.OtpCode or not user.OtpExpiry:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid request. Please request an OTP first."
        )
    
    if user.OtpCode != otp_verify.otp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The OTP is incorrect."
        )

    if user.OtpExpiry < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The OTP has expired."
        )
    
    user.OtpCode = None
    user.OtpExpiry = None
    db.commit()
    
    access_token = security.create_access_token(
        data={"sub": user.Email, "role": user.Role}
    )
    return {"access_token": access_token, "token_type": "bearer"}