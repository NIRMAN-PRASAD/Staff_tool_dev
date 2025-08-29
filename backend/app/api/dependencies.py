# backend/app/api/dependencies.py
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

# Direct, safe imports
from app.database.session import SessionLocal
from app.core import security
from app.database.models.user import User
from app.schemas.user_schema import TokenData

# This tells FastAPI that the URL to get a token is '/users/login/token'.
# NOTE: Our actual token URL is `/users/login/verify-otp`, but this `tokenUrl`
# is mainly for documentation purposes in OpenAPI/Swagger UI.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login/verify-otp", auto_error=False)


def get_db():
    """
    A dependency that provides a database session for each API request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    # The header token is now optional because we might get it from the query
    token: str = Depends(oauth2_scheme),
    # This is our fallback for direct links (e.g., downloads)
    token_query: str = Query(None, alias="token"), 
    db: Session = Depends(get_db)
) -> User:
    """
    The core security dependency. It decodes the JWT and returns the user from the DB.
    It can accept the token from either the "Authorization: Bearer" header or a "token" query parameter.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # --- THIS IS THE NEW LOGIC ---
    # Prioritize the header token, but use the query parameter as a fallback.
    final_token = token or token_query
    
    # If neither token is present, the user is not authenticated.
    if final_token is None:
        raise credentials_exception
    # --- END OF NEW LOGIC ---

    payload = security.decode_access_token(final_token) # <-- USE THE FINAL TOKEN
    if payload is None:
        raise credentials_exception
    
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    
    token_data = TokenData(email=email, role=payload.get("role"))

    user = db.query(User).filter(User.Email == token_data.email).first()
    
    if user is None:
        raise credentials_exception
    
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    A dependency that builds upon get_current_user to ensure the user is active.
    This is the dependency you will typically use to protect most routes.
    """
    if not current_user.IsActive:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user