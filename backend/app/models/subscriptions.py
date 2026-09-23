from enum import Enum
from typing import Optional, List
from sqlalchemy import String, BigInteger, Integer, Boolean, DateTime, JSON, Text, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models import Base, utc_now, generate_id

class BillingInterval(str, Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    ANNUAL = "ANNUAL"

class SubscriptionStatus(str, Enum):
    ACTIVE = "ACTIVE"
    TRIALING = "TRIALING"
    PAST_DUE = "PAST_DUE"
    PAUSED = "PAUSED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"

class MandateType(str, Enum):
    UPI_AUTOPAY = "UPI_AUTOPAY"
    E_NACH = "E_NACH"
    CARD_RECURRING = "CARD_RECURRING"

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("plan"))
    merchant_id: Mapped[str] = mapped_column(String(36), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    amount: Mapped[int] = mapped_column(BigInteger, nullable=False)  # minor currency units
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    
    billing_interval: Mapped[BillingInterval] = mapped_column(SQLEnum(BillingInterval), default=BillingInterval.MONTHLY, nullable=False)
    interval_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    trial_period_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    subscriptions: Mapped[List["Subscription"]] = relationship("Subscription", back_populates="plan", cascade="all, delete-orphan")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("sub"))
    merchant_id: Mapped[str] = mapped_column(String(36), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id: Mapped[str] = mapped_column(String(36), ForeignKey("subscription_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id: Mapped[str] = mapped_column(String(36), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    
    status: Mapped[SubscriptionStatus] = mapped_column(SQLEnum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE, nullable=False, index=True)
    mandate_type: Mapped[MandateType] = mapped_column(SQLEnum(MandateType), default=MandateType.UPI_AUTOPAY, nullable=False)
    mandate_token_reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # Secure provider token only
    
    current_period_start: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    current_period_end: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    trial_end: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    total_billing_cycles: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    completed_cycles: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failed_renewal_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    plan: Mapped["SubscriptionPlan"] = relationship("SubscriptionPlan", back_populates="subscriptions")
