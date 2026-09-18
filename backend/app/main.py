"""
Darukaa.Earth API entrypoint.

Wires together CORS, centralized exception handling, and all routers
(auth, projects, sites, analytics, dashboard).
"""

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.config import settings
from app.routes import analytics, auth, dashboard, projects, sites

logger = logging.getLogger("darukaa")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    # Never leak stack traces / connection strings to the client.
    logger.exception("Database error while handling %s %s", request.method, request.url)
    return JSONResponse(status_code=500, content={"detail": "A database error occurred. Please try again."})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error while handling %s %s", request.method, request.url)
    return JSONResponse(status_code=500, content={"detail": "An unexpected error occurred."})


@app.get("/", tags=["health"])
def read_root() -> dict:
    return {"service": "darukaa.earth-api", "status": "ok", "environment": settings.ENVIRONMENT}


@app.get("/api/health", tags=["health"])
def health_check() -> dict:
    return {"status": "healthy"}


app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(projects.router, prefix=settings.API_V1_PREFIX)
app.include_router(sites.router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics.router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)
