from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class PaymentLinkCreate(BaseModel):
    amount: int = Field(..., gt=0, description="Amount in minor units (paise)")
    currency: str = Field(default="INR", min_length=3, max_length=3)
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    customer_id: Optional[str] = None
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None
    allowed_payment_methods: Optional[Dict[str, bool]] = None
    expires_in_days: Optional[int] = Field(default=7, ge=1, le=365)
    metadata_json: Optional[Dict[str, Any]] = None

class PaymentLinkResponse(BaseModel):
    id: str
    merchant_id: str
    customer_id: Optional[str] = None
    payment_intent_id: Optional[str] = None
    checkout_session_id: Optional[str] = None
    amount: int
    currency: str
    title: str
    description: Optional[str] = None
    slug: str
    short_url: str
    status: str
    allowed_payment_methods: Optional[Dict[str, Any]] = None
    expires_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
