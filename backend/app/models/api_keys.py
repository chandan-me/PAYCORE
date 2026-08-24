from enum import Enum
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models import Base, utc_now, generate_id

class APIKeyType(str, Enum):
    PUBLISHABLE = "PUBLISHABLE"
    SECRET = "SECRET"

class APIKeyMode(str, Enum):
    TEST = "TEST"
    LIVE = "LIVE"

class APIKey(Base):
    __tablename__ = "api_keys"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("key"))
    merchant_id: Mapped[str] = mapped_column(String(36), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    key_type: Mapped[APIKeyType] = mapped_column(SQLEnum(APIKeyType), nullable=False)
    mode: Mapped[APIKeyMode] = mapped_column(SQLEnum(APIKeyMode), default=APIKeyMode.TEST, nullable=False)
    
    name: Mapped[str] = mapped_column(String(100), default="Default Key", nullable=False)
    key_prefix: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # e.g., pk_test_a1b2 or sk_test_c3d4
    key_hash: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_used_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    merchant: Mapped["Merchant"] = relationship("Merchant", back_populates="api_keys")
