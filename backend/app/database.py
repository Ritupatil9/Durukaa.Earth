"""
SQLAlchemy engine, session factory, and declarative base.

The FastAPI dependency `get_db` yields a session per-request and always
closes it, so connections are never leaked.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, future=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
