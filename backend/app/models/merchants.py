from enum import Enum
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, Integer, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models import Base, utc_now, generate_id

class OnboardingStatus(str, Enum):
    CREATED = "CREATED"
    PROFILE_INCOMPLETE = "PROFILE_INCOMPLETE"
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"

class MerchantRole(str, Enum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    DEVELOPER = "DEVELOPER"
    VIEWER = "VIEWER"

class MerchantMode(str, Enum):
    TEST = "TEST"
    LIVE = "LIVE"

class Merchant(Base):
    __tablename__ = "merchants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("mch"))
    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    legal_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    support_email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    gstin: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    onboarding_status: Mapped[OnboardingStatus] = mapped_column(SQLEnum(OnboardingStatus), default=OnboardingStatus.CREATED, nullable=False)
    onboarding_step: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    environment_mode: Mapped[MerchantMode] = mapped_column(SQLEnum(MerchantMode), default=MerchantMode.TEST, nullable=False)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    members: Mapped[List["MerchantMember"]] = relationship("MerchantMember", back_populates="merchant", cascade="all, delete-orphan")
    api_keys: Mapped[List["APIKey"]] = relationship("APIKey", back_populates="merchant", cascade="all, delete-orphan")
    webhook_endpoints: Mapped[List["WebhookEndpoint"]] = relationship("WebhookEndpoint", back_populates="merchant", cascade="all, delete-orphan")
    balances: Mapped[List["Balance"]] = relationship("Balance", back_populates="merchant", cascade="all, delete-orphan")

class MerchantMember(Base):
    __tablename__ = "merchant_members"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("mcm"))
    merchant_id: Mapped[str] = mapped_column(String(36), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[MerchantRole] = mapped_column(SQLEnum(MerchantRole), default=MerchantRole.ADMIN, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    merchant: Mapped["Merchant"] = relationship("Merchant", back_populates="members")
    user: Mapped["User"] = relationship("User", back_populates="merchant_memberships")
