from enum import Enum
from typing import Optional
from sqlalchemy import String, BigInteger, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models import Base, utc_now, generate_id
from app.models.payments import PaymentMode

class TransactionType(str, Enum):
    PAYMENT = "PAYMENT"
    REFUND = "REFUND"
    ADJUSTMENT = "ADJUSTMENT"
    FEE = "FEE"
    PAYOUT = "PAYOUT"

class TransactionStatus(str, Enum):
    PENDING = "PENDING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    REVERSED = "REVERSED"

class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("txn"))
    payment_intent_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("payment_intents.id", ondelete="CASCADE"), nullable=True, index=True)
    merchant_id: Mapped[str] = mapped_column(String(36), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    refund_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("refunds.id", ondelete="CASCADE"), nullable=True, index=True)
    
    amount: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    type: Mapped[TransactionType] = mapped_column(SQLEnum(TransactionType), nullable=False)
    status: Mapped[TransactionStatus] = mapped_column(SQLEnum(TransactionStatus), default=TransactionStatus.PENDING, nullable=False, index=True)
    mode: Mapped[PaymentMode] = mapped_column(SQLEnum(PaymentMode), default=PaymentMode.TEST, nullable=False)
    
    provider_id: Mapped[str] = mapped_column(String(50), default="sandbox", nullable=False)
    provider_transaction_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    fee_amount: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    net_amount: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    
    error_code: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    payment_intent: Mapped[Optional["PaymentIntent"]] = relationship("PaymentIntent", back_populates="transactions")
