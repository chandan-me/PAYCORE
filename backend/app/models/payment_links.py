from enum import Enum
from typing import Optional, List
from sqlalchemy import String, BigInteger, Integer, Boolean, DateTime, JSON, Text, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models import Base, utc_now, generate_id

class PaymentLinkStatus(str, Enum):
    ACTIVE = "ACTIVE"
    PAID = "PAID"
    EXPIRED = "EXPIRED"
    DISABLED = "DISABLED"

class PaymentLink(Base):
    __tablename__ = "payment_links"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("plink"))
    merchant_id: Mapped[str] = mapped_column(String(36), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    payment_intent_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("payment_intents.id", ondelete="SET NULL"), nullable=True, index=True)
    checkout_session_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("checkout_sessions.id", ondelete="SET NULL"), nullable=True, index=True)
    
    amount: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    slug: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    short_url: Mapped[str] = mapped_column(String(255), nullable=False)
    
    status: Mapped[PaymentLinkStatus] = mapped_column(SQLEnum(PaymentLinkStatus), default=PaymentLinkStatus.ACTIVE, nullable=False, index=True)
    allowed_payment_methods: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    expires_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), nullable=True)
    paid_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
