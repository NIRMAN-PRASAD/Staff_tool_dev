# backend/app/schemas/department_schema.py

from pydantic import BaseModel
from typing import Optional

class DepartmentCreate(BaseModel):
    DepartmentName: str
    Description: Optional[str] = None
    PortfolioID: int # <-- CHANGE: This field is now required

class Department(DepartmentCreate):
    DepartmentID: int
    class Config:
        from_attributes = True