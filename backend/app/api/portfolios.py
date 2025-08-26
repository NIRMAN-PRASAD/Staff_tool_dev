from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
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
    dependencies=[Depends(get_current_active_user)]  # Protect all routes in this file
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
        **portfolio.model_dump(exclude_unset=True), # Use exclude_unset=True for flexibility
        CreatedBy=current_user.UserID
    )
    db.add(db_portfolio)
    db.commit()
    db.refresh(db_portfolio)
    return db_portfolio

@router.get("/", response_model=List[portfolio_schema.Portfolio])
def read_portfolios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve a list of all portfolios, ordered by name.
    """
    # <-- YAHAN TYPO THEEK KIYA GAYA HAI -->
    # 'portfolio_name' (lowercase) ko 'PortfolioName' (CamelCase) kiya gaya hai
    portfolios = db.query(portfolio_model.Portfolio).order_by(portfolio_model.Portfolio.PortfolioName).offset(skip).limit(limit).all()
    return portfolios

@router.get("/{portfolio_id}", response_model=portfolio_schema.Portfolio)
def read_portfolio(portfolio_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single portfolio by its ID.
    """
    db_portfolio = db.query(portfolio_model.Portfolio).filter(portfolio_model.Portfolio.PortfolioID == portfolio_id).first()
    if db_portfolio is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")
    return db_portfolio

# You can add PUT and DELETE endpoints here later if needed
# Example for PUT:
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