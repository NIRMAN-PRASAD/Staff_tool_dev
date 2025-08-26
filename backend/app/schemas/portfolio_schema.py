# backend/app/schemas/portfolio_schema.py

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# A slimmed down Department schema to avoid circular dependencies when nesting
class DepartmentInPortfolio(BaseModel):
    DepartmentID: int
    DepartmentName: str
    Description: Optional[str] = None
    
    class Config:
        from_attributes = True

class PortfolioCreate(BaseModel):
    PortfolioName: str
    Description: Optional[str] = None
    CreatedBy: Optional[int] = None

class Portfolio(BaseModel):
    PortfolioID: int
    PortfolioName: str
    Description: Optional[str] = None
    CreatedBy: Optional[int] = None
    CreatedAt: datetime
    UpdatedAt: Optional[datetime] = None
    
    # <-- CHANGE: A portfolio will now return a list of its departments -->
    departments: List[DepartmentInPortfolio] = []

    class Config:
        from_attributes = True