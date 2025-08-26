# app/database/base.py
from sqlalchemy.ext.declarative import declarative_base

# This Base will be used by all models to inherit from.
Base = declarative_base()