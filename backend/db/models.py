from __future__ import annotations
import json
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session, relationship

from config import Config


engine = create_engine(Config.DATABASE_URL, future=True, echo=False)
SessionLocal = scoped_session(sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True))
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    personas = relationship("Persona", back_populates="owner", cascade="all, delete-orphan")


class Persona(Base):
    __tablename__ = "personas"
    id = Column(String, primary_key=True)
    slug = Column(String, nullable=False, unique=True, index=True)
    owner_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    data = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    version = Column(Integer, default=1, nullable=False)
    owner = relationship("User", back_populates="personas")

    def to_dict(self) -> dict:
        return json.loads(self.data)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_session():
    return SessionLocal()
