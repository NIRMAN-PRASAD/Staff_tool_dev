# backend/app/schemas/workflow_schema.py

from pydantic import BaseModel
from typing import Optional

# Yeh schema job create karte time frontend se aayega
class StageTemplateCreate(BaseModel):
    StageName: str
    InterviewerInfo: Optional[str] = None
    Sequence: int

# Yeh schema API se response bhejte time use hoga
class StageTemplate(StageTemplateCreate):
    StageID: int
    JobID: int

    class Config:
        from_attributes = True