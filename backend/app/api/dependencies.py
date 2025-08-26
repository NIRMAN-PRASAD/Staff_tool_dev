from fastapi import Depends, HTTPException, status
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
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login/verify-otp")


def get_db():
    """
    A dependency that provides a database session for each API request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    The core security dependency. It decodes the JWT and returns the user from the DB.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = security.decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    
    token_data = TokenData(email=email, role=payload.get("role"))

    # <-- YAHAN CHANGE KIYA GAYA HAI -->
    # .email (lowercase) se .Email (Capital E) kiya gaya hai to match the DB model
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