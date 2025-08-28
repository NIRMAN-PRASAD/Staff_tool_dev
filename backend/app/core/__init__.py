# backend/app/core/__init__.py
from pydantic import BaseModel

class AISettingBase(BaseModel):
    setting_name: str
    setting_value: str
    description: str

class AISetting(AISettingBase):
    id: int
    class Config:
        from_attributes = True

class AISettingUpdate(BaseModel):
    setting_value: str