from enum import Enum
from typing import Optional
from sqlalchemy import String, Integer, DateTime, JSON, Text, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.models import Base, utc_now, generate_id

class EventOutboxStatus(str, Enum):
    PENDING = "PENDING"
    PUBLISHED = "PUBLISHED"
    FAILED = "FAILED"

class EventOutbox(Base):
    __tablename__ = "events_outbox"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: generate_id("evt"))
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    aggregate_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # payment, refund, dispute, payout, settlement
    aggregate_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    merchant_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    status: Mapped[EventOutboxStatus] = mapped_column(SQLEnum(EventOutboxStatus), default=EventOutboxStatus.PENDING, nullable=False, index=True)
    
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    published_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
