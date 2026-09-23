from typing import Optional
from sqlalchemy import String, Integer, BigInteger, Boolean, DateTime, JSON, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models import Base, utc_now, generate_id

class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("inv"))
    merchant_id: Mapped[str] = mapped_column(String(36), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    payment_intent_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("payment_intents.id", ondelete="SET NULL"), nullable=True, index=True)
    
    invoice_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    order_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Customer Details Snapshot
    customer_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    customer_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    customer_gstin: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    customer_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Financial breakdown (in minor units / paise)
    subtotal: Mapped[int] = mapped_column(BigInteger, nullable=False)
    cgst_amount: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    sgst_amount: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    igst_amount: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    tax_amount: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    discount_amount: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    total_amount: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    
    # Line items: list of {description, quantity, unit_price, tax_rate, amount}
    line_items: Mapped[dict] = mapped_column(JSON, default=list, nullable=False)
    
    status: Mapped[str] = mapped_column(String(50), default="PAID", nullable=False, index=True)  # DRAFT, ISSUED, PAID, VOID, CANCELLED
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    terms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    due_date: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), nullable=True)
    paid_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), nullable=True)
    pdf_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("ntf"))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(50), default="INFO", nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("aud"))
    actor_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    actor_type: Mapped[str] = mapped_column(String(50), nullable=False)  # USER, MERCHANT, SYSTEM, API_KEY
    
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(100), nullable=False)
    
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

class RiskEvent(Base):
    __tablename__ = "risk_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("rsk"))
    payment_intent_id: Mapped[str] = mapped_column(String(36), ForeignKey("payment_intents.id", ondelete="CASCADE"), nullable=False, index=True)
    merchant_id: Mapped[str] = mapped_column(String(36), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False)  # 0 to 100
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False)  # LOW, MEDIUM, HIGH, BLOCKED
    rules_triggered_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

class Provider(Base):
    __tablename__ = "providers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("pvd"))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)  # sandbox, stripe, razorpay, payu, cashfree
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    config_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

class IdempotencyKey(Base):
    __tablename__ = "idempotency_keys"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("idm"))
    key: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    merchant_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    
    path: Mapped[str] = mapped_column(String(255), nullable=False)
    request_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    response_code: Mapped[int] = mapped_column(Integer, nullable=False)
    response_body: Mapped[dict] = mapped_column(JSON, nullable=False)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    expires_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
