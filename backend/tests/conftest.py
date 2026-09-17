"""
Shared pytest fixtures.

Tests run against DATABASE_URL (see .env / CI service container), but on a
dedicated schema-per-test-run basis: each test session creates all tables
fresh and drops them afterwards, so tests never depend on manual setup.
"""

import os

os.environ.setdefault("DATABASE_URL", "postgresql://darukaa:darukaa@localhost:5432/darukaa_earth_test")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.database import Base, SessionLocal, engine
from app.main import app


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        conn.commit()
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(autouse=True)
def clean_tables():
    """Truncate all app tables before every test so tests never leak state
    (e.g. a duplicate email from a previous test) into one another."""
    with engine.connect() as conn:
        conn.execute(text("TRUNCATE TABLE site_analytics, sites, projects, users RESTART IDENTITY CASCADE"))
        conn.commit()
    yield


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def auth_headers(client):
    """Registers a fresh user and returns Authorization headers for it."""
    payload = {
        "name": "Test User",
        "email": "tester@example.com",
        "password": "TestPass123",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
