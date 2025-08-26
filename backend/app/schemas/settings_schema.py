# app/schemas/settings_schema.py

from pydantic import BaseModel

class AISettingBase(BaseModel):
    setting_name: str
    setting_value: str
    description: str

# --- MAKE SURE THIS CLASS NAME IS SINGULAR ---
class AISetting(AISettingBase): 
    id: int
    class Config:
        from_attributes = True

class AISettingUpdate(BaseModel):
    setting_value: str