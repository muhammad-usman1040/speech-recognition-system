# Optional: Database integration for production
# This file provides database setup for persistent storage

from sqlalchemy import create_engine, Column, String, Float, DateTime, Text, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# Database URL (PostgreSQL recommended for production)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./transcriptions.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Transcription(Base):
    __tablename__ = "transcriptions"
    
    id = Column(String, primary_key=True)
    filename = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    language = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    duration = Column(Float, nullable=False)
    segments_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
