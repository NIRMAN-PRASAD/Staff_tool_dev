# backend/app/api/skills.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.models import skill as skill_model
from app.database.models import user as user_model
from app.schemas import skill_schema
from app.api.dependencies import get_db, get_current_active_user

router = APIRouter(
    prefix="/skills",
    tags=["Skills"],
)

@router.post("/", response_model=skill_schema.Skill, status_code=status.HTTP_201_CREATED)
def create_skill(
    skill: skill_schema.SkillCreate, 
    db: Session = Depends(get_db), 
    current_user: user_model.User = Depends(get_current_active_user)
):
    """
    Creates a new skill in the database. Only accessible by Admin or HR.
    """
    if current_user.Role not in ["Admin", "HR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create skills."
        )

    # Check if skill already exists (case-insensitive)
    existing_skill = db.query(skill_model.Skill).filter(
        skill_model.Skill.SkillName.ilike(skill.SkillName)
    ).first()
    if existing_skill:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Skill '{skill.SkillName}' already exists."
        )

    db_skill = skill_model.Skill(
        **skill.model_dump(),
        CreatedBy=current_user.UserID
    )
    db.add(db_skill)
    db.commit()
    db.refresh(db_skill)
    return db_skill

@router.get("/", response_model=List[skill_schema.Skill])
def read_skills(
    q: Optional[str] = None, 
    db: Session = Depends(get_db), 
    current_user: user_model.User = Depends(get_current_active_user)
):
    """
    Retrieves a list of all skills.
    Can be filtered with a search query 'q' for autocomplete functionality.
    """
    query = db.query(skill_model.Skill)
    if q:
        query = query.filter(skill_model.Skill.SkillName.ilike(f"%{q}%"))
    
    skills = query.order_by(skill_model.Skill.SkillName).all()
    return skills