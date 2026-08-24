from enum import Enum
from typing import Optional, List
from sqlalchemy import String, BigInteger, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models import Base, utc_now, generate_id

class LedgerAccountType(str, Enum):
    CUSTOMER_CLEARING = "CUSTOMER_CLEARING"
    MERCHANT_PAYABLE = "MERCHANT_PAYABLE"
    PLATFORM_REVENUE = "PLATFORM_REVENUE"
    RESERVE_HOLD = "RESERVE_HOLD"
    PROVIDER_SETTLEMENT = "PROVIDER_SETTLEMENT"

class EntryType(str, Enum):
    DEBIT = "DEBIT"
    CREDIT = "CREDIT"

class LedgerAccount(Base):
    __tablename__ = "ledger_accounts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("lac"))
    merchant_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=True, index=True)
    account_type: Mapped[LedgerAccountType] = mapped_column(SQLEnum(LedgerAccountType), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    entries: Mapped[List["LedgerEntry"]] = relationship("LedgerEntry", back_populates="account")

class LedgerTransaction(Base):
    __tablename__ = "ledger_transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("ltx"))
    reference_type: Mapped[str] = mapped_column(String(50), nullable=False)  # PAYMENT, REFUND, FEE, PAYOUT
    reference_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="POSTED", nullable=False)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    entries: Mapped[List["LedgerEntry"]] = relationship("LedgerEntry", back_populates="ledger_transaction", cascade="all, delete-orphan")

class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("len"))
    ledger_transaction_id: Mapped[str] = mapped_column(String(36), ForeignKey("ledger_transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    ledger_account_id: Mapped[str] = mapped_column(String(36), ForeignKey("ledger_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    
    entry_type: Mapped[EntryType] = mapped_column(SQLEnum(EntryType), nullable=False)
    amount: Mapped[int] = mapped_column(BigInteger, nullable=False)  # Always positive integer minor units
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    ledger_transaction: Mapped["LedgerTransaction"] = relationship("LedgerTransaction", back_populates="entries")
    account: Mapped["LedgerAccount"] = relationship("LedgerAccount", back_populates="entries")

class Balance(Base):
    __tablename__ = "balances"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("bal"))
    merchant_id: Mapped[str] = mapped_column(String(36), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    
    available_amount: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    pending_amount: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    reserved_amount: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    merchant: Mapped["Merchant"] = relationship("Merchant", back_populates="balances")
