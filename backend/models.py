# backend/models.py
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func

# Changed from relative to absolute import to fix the startup error.
from database import Base


class AnalysisHistory(Base):
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, index=True)
    language = Column(String, index=True)
    code = Column(Text)
    explanation = Column(Text)
    suggestions = Column(Text)  # Storing list as JSON string
    bugs = Column(Text)  # Storing list as JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())
