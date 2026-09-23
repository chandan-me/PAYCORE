import os
from typing import List, Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "PAYCORE Payment Platform"
    API_V1_STR: str = "/v1"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Primary Database: MySQL 8.0+
    DATABASE_URL: str = "mysql+aiomysql://root:password@localhost:3306/paycore"
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_DATABASE: str = "paycore"
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = "password"
    
    # Redis Queue & Caching
    REDIS_URL: str = "redis://localhost:6379/0"

    # Celery Background Workers
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # JWT Authentication
    JWT_SECRET_KEY: str = "paycore_super_secret_jwt_key_2026_change_in_production_32bytes"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Google OAuth 2.0 Credentials
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # Encryption / Security
    PAYCORE_ENCRYPTION_KEY: str = "paycore_secret_encryption_key_32b"
    WEBHOOK_SIGNING_SECRET: str = "whsec_paycore_live_webhook_signature_secret_key"
    
    # Live Payment Gateway Credentials (Environment Configured)
    RAZORPAY_KEY_ID: Optional[str] = None
    RAZORPAY_KEY_SECRET: Optional[str] = None
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    PAYU_MERCHANT_KEY: Optional[str] = None
    PAYU_MERCHANT_SALT: Optional[str] = None
    CASHFREE_APP_ID: Optional[str] = None
    CASHFREE_SECRET_KEY: Optional[str] = None

    # Environment URLs
    FRONTEND_URL: str = "http://localhost:5173"
    API_URL: str = "http://localhost:8000"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]

    # Sandbox configuration
    SANDBOX_ENABLED: bool = True

    class Config:
        env_file = [".env", "../.env"]
        extra = "ignore"

settings = Settings()
