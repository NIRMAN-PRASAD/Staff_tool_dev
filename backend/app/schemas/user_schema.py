from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# ====================================================================
# Schemas for User Data
# ====================================================================

class UserBase(BaseModel):
    """Properties shared across user models."""
    Email: EmailStr
    UserName: Optional[str] = None
    Role: str = "HR"

class UserCreate(UserBase):
    """Properties required when creating a new user via the API."""
    pass

class User(UserBase):
    """
    Properties to return to the client (from the database).
    These field names MUST EXACTLY MATCH the column names in the User model.
    """
    # <-- YEH SABSE ZAROORI CHANGES HAIN -->
    # Inko CamelCase kiya gaya hai taaki DB Model se match ho sake
    UserID: int
    IsActive: bool
    CreatedAt: datetime

    class Config:
        # This allows Pydantic to read data directly from ORM models
        from_attributes = True


# ====================================================================
# Schemas for Updating Users (e.g., from an Admin Panel)
# ====================================================================

class UserRoleUpdate(BaseModel):
    """The request model for the endpoint that updates a user's role."""
    role: str


# ====================================================================
# Schemas for Authentication (Tokens)
# ====================================================================

class Token(BaseModel):
    """The response model when a user successfully logs in."""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """The data model for the content encoded inside the JWT."""
    email: Optional[str] = None
    role: Optional[str] = None


# ====================================================================
# Schemas for OTP (One-Time Password) Functionality
# ====================================================================

class OtpRequest(BaseModel):
    """The request model when a user asks for an OTP."""
    email: EmailStr

class OtpVerify(BaseModel):
    """The request model when a user submits an OTP for verification."""
    email: EmailStr
    otp: str