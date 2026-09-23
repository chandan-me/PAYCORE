from enum import Enum
from typing import Optional, List
from sqlalchemy import String, BigInteger, Integer, Boolean, DateTime, JSON, Text, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models import Base, utc_now, generate_id

class SettlementStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    SETTLED = "SETTLED"
    FAILED = "FAILED"

class PayoutStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    REVERSED = "REVERSED"

class PayoutMethod(str, Enum):
    IMPS = "IMPS"
    NEFT = "NEFT"
    RTGS = "RTGS"
    INSTANT = "INSTANT"

class SettlementBatch(Base):
    __tablename__ = "settlement_batches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("setbat"))
    settlement_cycle: Mapped[str] = mapped_column(String(10), default="T+1", nullable=False)  # T+1 or T+2
    status: Mapped[SettlementStatus] = mapped_column(SQLEnum(SettlementStatus), default=SettlementStatus.PENDING, nullable=False, index=True)
    total_amount: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    total_merchants: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    processed_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    settlements: Mapped[List["Settlement"]] = relationship("Settlement", back_populates="batch", cascade="all, delete-orphan")

class Settlement(Base):
    __tablename__ = "settlements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("set"))
    batch_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("settlement_batches.id", ondelete="SET NULL"), nullable=True, index=True)
    merchant_id: Mapped[str] = mapped_column(String(36), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    gross_amount: Mapped[int] = mapped_column(BigInteger, nullable=False)
    fee_amount: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    tax_amount: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    refund_deduction: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    dispute_deduction: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    net_settlement_amount: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    
    status: Mapped[SettlementStatus] = mapped_column(SQLEnum(SettlementStatus), default=SettlementStatus.PENDING, nullable=False, index=True)
    settlement_date: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    utr_number: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    batch: Mapped[Optional["SettlementBatch"]] = relationship("SettlementBatch", back_populates="settlements")

class PayoutBatch(Base):
    __tablename__ = "payout_batches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("pob"))
    status: Mapped[PayoutStatus] = mapped_column(SQLEnum(PayoutStatus), default=PayoutStatus.PENDING, nullable=False, index=True)
    total_amount: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    total_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    payouts: Mapped[List["Payout"]] = relationship("Payout", back_populates="batch", cascade="all, delete-orphan")

class Payout(Base):
    __tablename__ = "payouts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("po"))
    merchant_id: Mapped[str] = mapped_column(String(36), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("payout_batches.id", ondelete="SET NULL"), nullable=True, index=True)
    
    amount: Mapped[int] = mapped_column(BigInteger, nullable=False)
    fee_amount: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    
    payout_method: Mapped[PayoutMethod] = mapped_column(SQLEnum(PayoutMethod), default=PayoutMethod.IMPS, nullable=False)
    status: Mapped[PayoutStatus] = mapped_column(SQLEnum(PayoutStatus), default=PayoutStatus.PENDING, nullable=False, index=True)
    
    bank_account_number: Mapped[str] = mapped_column(String(34), nullable=False)
    bank_ifsc: Mapped[str] = mapped_column(String(20), nullable=False)
    account_holder_name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    utr: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    provider_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    failure_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    idempotency_key: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True, index=True)
    
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    batch: Mapped[Optional["PayoutBatch"]] = relationship("PayoutBatch", back_populates="payouts")
