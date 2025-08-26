from sqlalchemy import Column, Integer, String, TIMESTAMP, Text, ForeignKey, text
from sqlalchemy.orm import relationship
from app.database.base import Base

class Department(Base):
    __tablename__ = "Departments"
    DepartmentID = Column(Integer, primary_key=True, index=True)
    DepartmentName = Column(String(255), nullable=False)
    Description = Column(Text)
    PortfolioID = Column(Integer, ForeignKey("Portfolios.PortfolioID"), nullable=False)
    
    # <-- YAHAN SAB CONSISTENT KIYA GAYA HAI -->
    CreatedAt = Column(TIMESTAMP, server_default=text('now()'))
    CreatedBy = Column(Integer, ForeignKey("Users.UserID"))
    UpdatedAt = Column(TIMESTAMP)
    UpdatedBy = Column(Integer, ForeignKey("Users.UserID"))

    portfolio = relationship("Portfolio", back_populates="departments")

class Portfolio(Base):
    __tablename__ = "Portfolios"
    PortfolioID = Column(Integer, primary_key=True, index=True)
    PortfolioName = Column(String(255), nullable=False)
    Description = Column(Text)
    
    # <-- YAHAN SAB CONSISTENT KIYA GAYA HAI -->
    CreatedAt = Column(TIMESTAMP, server_default=text('now()'))
    CreatedBy = Column(Integer, ForeignKey("Users.UserID"))
    UpdatedAt = Column(TIMESTAMP)
    UpdatedBy = Column(Integer, ForeignKey("Users.UserID"))

    departments = relationship("Department", back_populates="portfolio")