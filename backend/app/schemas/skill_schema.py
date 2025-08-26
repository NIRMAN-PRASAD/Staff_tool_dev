# backend/app/schemas/skill_schema.py

from pydantic import BaseModel
from typing import Optional

class SkillBase(BaseModel):
    SkillName: str
    SkillCategory: Optional[str] = None

class SkillCreate(SkillBase):
    pass

class Skill(SkillBase):
    SkillID: int

    class Config:
        from_attributes = True