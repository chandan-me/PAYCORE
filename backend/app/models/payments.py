from enum import Enum
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Integer, BigInteger, Boolean, DateTime, JSON, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models import Base, utc_now, generate_id

class PaymentIntentStatus(str, Enum):
    REQUIRES_PAYMENT_METHOD = "REQUIRES_PAYMENT_METHOD"
    REQUIRES_CONFIRMATION = "REQUIRES_CONFIRMATION"
    PROCESSING = "PROCESSING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"
    PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED"

class PaymentMethodType(str, Enum):
    CARD = "CARD"
    UPI = "UPI"
    NET_BANKING = "NET_BANKING"
    WALLET = "WALLET"
    BANK_TRANSFER = "BANK_TRANSFER"

class PaymentMode(str, Enum):
    TEST = "TEST"
    LIVE = "LIVE"

class PaymentIntent(Base):
    __tablename__ = "payment_intents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("pi"))
    merchant_id: Mapped[str] = mapped_column(String(36), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    
    amount: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    status: Mapped[PaymentIntentStatus] = mapped_column(SQLEnum(PaymentIntentStatus), default=PaymentIntentStatus.REQUIRES_PAYMENT_METHOD, nullable=False, index=True)
    mode: Mapped[PaymentMode] = mapped_column(SQLEnum(PaymentMode), default=PaymentMode.TEST, nullable=False, index=True)
    
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    statement_descriptor: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    client_secret: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    
    selected_payment_method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    selected_payment_details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    captured_amount: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    refunded_amount: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    
    error_code: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    transactions: Mapped[List["Transaction"]] = relationship("Transaction", back_populates="payment_intent", cascade="all, delete-orphan")
    checkout_session: Mapped[Optional["CheckoutSession"]] = relationship("CheckoutSession", back_populates="payment_intent", uselist=False)
    refunds: Mapped[List["Refund"]] = relationship("Refund", back_populates="payment_intent", cascade="all, delete-orphan")
    disputes: Mapped[List["Dispute"]] = relationship("Dispute", back_populates="payment_intent", cascade="all, delete-orphan")

class CheckoutSessionStatus(str, Enum):
    OPEN = "OPEN"
    COMPLETED = "COMPLETED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"

class CheckoutSession(Base):
    __tablename__ = "checkout_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("cs"))
    payment_intent_id: Mapped[str] = mapped_column(String(36), ForeignKey("payment_intents.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    merchant_id: Mapped[str] = mapped_column(String(36), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    customer_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    amount: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    mode: Mapped[PaymentMode] = mapped_column(SQLEnum(PaymentMode), default=PaymentMode.TEST, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    success_url: Mapped[str] = mapped_column(String(512), nullable=False)
    cancel_url: Mapped[str] = mapped_column(String(512), nullable=False)
    
    status: Mapped[CheckoutSessionStatus] = mapped_column(SQLEnum(CheckoutSessionStatus), default=CheckoutSessionStatus.OPEN, nullable=False)
    expires_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    payment_intent: Mapped["PaymentIntent"] = relationship("PaymentIntent", back_populates="checkout_session")
