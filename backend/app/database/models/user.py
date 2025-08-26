from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, text
from app.database.base import Base

class User(Base):
    __tablename__ = "Users"  # Capital "U"

    UserID = Column(Integer, primary_key=True, index=True) # CamelCase "UserID"
    UserName = Column(String(255))
    Email = Column(String(255), unique=True, index=True, nullable=False)
    OtpCode = Column(String(10), nullable=True)
    OtpExpiry = Column(TIMESTAMP(timezone=True), nullable=True)
    Role = Column(String(50), nullable=False)
    IsActive = Column(Boolean, default=True)
    CreatedAt = Column(TIMESTAMP(timezone=True), server_default=text('now()'))