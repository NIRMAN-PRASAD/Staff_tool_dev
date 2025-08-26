# backend/app/api/departments.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.models import portfolio_department as models
from app.database.models import user as user_model
from app.schemas import department_schema
from app.api.dependencies import get_db, get_current_active_user

router = APIRouter(
    prefix="/departments",
    tags=["Departments"],
    dependencies=[Depends(get_current_active_user)]
)

@router.post("/", response_model=department_schema.Department, status_code=status.HTTP_201_CREATED)
def create_department(
    dept: department_schema.DepartmentCreate, 
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_active_user)
):
    # <-- CHANGE: Verify that the PortfolioID exists before creating -->
    db_portfolio = db.query(models.Portfolio).filter(models.Portfolio.PortfolioID == dept.PortfolioID).first()
    if not db_portfolio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Portfolio with ID {dept.PortfolioID} not found")
        
    db_dept = models.Department(
        **dept.model_dump(),
        CreatedBy=current_user.UserID
    )
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept

@router.get("/", response_model=List[department_schema.Department])
def read_departments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    departments = db.query(models.Department).offset(skip).limit(limit).all()
    return departments