"""
Centralized application configuration.

All secrets and environment-specific values are read from environment
variables (see .env.example). Nothing here should be hardcoded.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "Darukaa.Earth API"
    API_V1_PREFIX: str = "/api"
    ENVIRONMENT: str = "development"

    DATABASE_URL: str = "postgresql://darukaa:darukaa@localhost:5433/darukaa_earth"

    JWT_SECRET_KEY: str = "insecure-dev-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    BACKEND_CORS_ORIGINS: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "https://frontend-six-indol-m9we45dec6.vercel.app,"
        "https://frontend-git-main-ritu-s-projects-67d9b022.vercel.app,"
        "https://frontend-g6r0svos1-ritu-s-projects-67d9b022.vercel.app"
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
