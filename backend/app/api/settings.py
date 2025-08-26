# in app/api/settings.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
# ... other imports
from app.database.models import settings as settings_model
from app.schemas import settings_schema
from app.api.dependencies import get_db
router = APIRouter(prefix="/settings/ai", tags=["AI Settings"])

@router.get("/", response_model=List[settings_schema.AISetting])
def get_ai_settings(db: Session = Depends(get_db)):
    """
    Get all AI settings from the database.
    """
    return db.query(settings_model.AISettings).all()

@router.put("/{setting_name}", response_model=settings_schema.AISetting)
def update_ai_setting(setting_name: str, setting: settings_schema.AISettingUpdate, db: Session = Depends(get_db)):
    """
    Update the value of a specific AI setting.
    """
    db_setting = db.query(settings_model.AISettings).filter(settings_model.AISettings.setting_name == setting_name).first()
    if not db_setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    db_setting.setting_value = setting.setting_value
    db.commit()
    db.refresh(db_setting)
    return db_setting