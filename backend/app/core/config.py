from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "CV Studio"
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173"]

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://cvstudio:cvstudio@localhost:5432/cvstudio"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Storage
    STORAGE_BACKEND: str = "local"   # local | r2
    STORAGE_PATH: str = "./storage"
    R2_ENDPOINT_URL: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "cvstudio"

    # Claude
    ANTHROPIC_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-sonnet-4-20250514"

    # Etsy
    ETSY_API_KEY: str = ""
    ETSY_API_SECRET: str = ""
    ETSY_REDIRECT_URI: str = "http://localhost:8000/auth/etsy/callback"

    # LibreOffice
    LIBREOFFICE_PATH: str = "soffice"

    # Celery
    CELERY_TASK_TIMEOUT: int = 300
    MAX_BATCH_SIZE: int = 50

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        # Parse comma-separated ALLOWED_ORIGINS
        @classmethod
        def parse_env_var(cls, field_name, raw_val):
            if field_name == "ALLOWED_ORIGINS":
                return [x.strip() for x in raw_val.split(",")]
            return raw_val


settings = Settings()
