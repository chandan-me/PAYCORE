import os
from typing import List, Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "PAYCORE Payment Platform"
    API_V1_STR: str = "/v1"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Primary Database: PostgreSQL
    DATABASE_URL: str = "postgresql+asyncpg://postgres:chandan475219@localhost:5432/paycore"
    
    # Redis Queue & Caching
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT Authentication
    JWT_SECRET_KEY: str = "paycore_super_secret_jwt_key_2026_change_in_production_32bytes"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Encryption / Security
    PAYCORE_ENCRYPTION_KEY: str = "paycore_secret_encryption_key_32b"
    WEBHOOK_SIGNING_SECRET: str = "whsec_paycore_live_webhook_signature_secret_key"
    
    # Environment URLs
    FRONTEND_URL: str = "http://localhost:5173"
    API_URL: str = "http://localhost:8000"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    # Sandbox configuration
    SANDBOX_ENABLED: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
