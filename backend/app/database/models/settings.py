# app/database/models/settings.py
from sqlalchemy import Column, Integer, String
from app.database.base import Base

class AISettings(Base):
    __tablename__ = "ai_settings"

    id = Column(Integer, primary_key=True, index=True)
    setting_name = Column(String, unique=True, nullable=False)
    setting_value = Column(String, nullable=False)
    description = Column(String)