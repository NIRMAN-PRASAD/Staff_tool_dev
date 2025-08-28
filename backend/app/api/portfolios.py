# backend/app/api/portfolios.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload # <--- IMPORT selectinload
from typing import List
from datetime import datetime

# Import models, schemas, and dependencies
from app.database.models import portfolio_department as portfolio_model
from app.database.models import user as user_model
from app.schemas import portfolio_schema
from app.api.dependencies import get_db, get_current_active_user

router = APIRouter(
    prefix="/portfolios",
    tags=["Portfolios"],
    dependencies=[Depends(get_current_active_user)]
)

@router.post("/", response_model=portfolio_schema.Portfolio, status_code=status.HTTP_201_CREATED)
def create_portfolio(
    portfolio: portfolio_schema.PortfolioCreate, 
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_active_user)
):
    """
    Create a new portfolio company. The user creating it is automatically assigned.
    """
    db_portfolio = portfolio_model.Portfolio(
        **portfolio.model_dump(exclude_unset=True),
        CreatedBy=current_user.UserID
    )
    db.add(db_portfolio)
    db.commit()
    db.refresh(db_portfolio)
    return db_portfolio

@router.get("/", response_model=List[portfolio_schema.Portfolio])
def read_portfolios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve a list of all portfolios, with their associated departments.
    """
    portfolios = db.query(portfolio_model.Portfolio).options(
        selectinload(portfolio_model.Portfolio.departments) # <--- THIS IS THE FIX
    ).order_by(
        portfolio_model.Portfolio.PortfolioName
    ).offset(skip).limit(limit).all()
    return portfolios

@router.get("/{portfolio_id}", response_model=portfolio_schema.Portfolio)
def read_portfolio(portfolio_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single portfolio by its ID, with its associated departments.
    """
    db_portfolio = db.query(portfolio_model.Portfolio).options(
        selectinload(portfolio_model.Portfolio.departments) # <--- Also good to add it here
    ).filter(
        portfolio_model.Portfolio.PortfolioID == portfolio_id
    ).first()

    if db_portfolio is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")
    return db_portfolio

@router.put("/{portfolio_id}", response_model=portfolio_schema.Portfolio)
def update_portfolio(
    portfolio_id: int,
    portfolio_update: portfolio_schema.PortfolioCreate,
    db: Session = Depends(get_db),
    current_user: user_model.User = Depends(get_current_active_user)
):
    """
    Update an existing portfolio.
    """
    db_portfolio = db.query(portfolio_model.Portfolio).filter(portfolio_model.Portfolio.PortfolioID == portfolio_id).first()
    if not db_portfolio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")

    update_data = portfolio_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_portfolio, key, value)
    
    db_portfolio.UpdatedAt = datetime.utcnow()
    db_portfolio.UpdatedBy = current_user.UserID
    
    db.commit()
    db.refresh(db_portfolio)
    return db_portfolio