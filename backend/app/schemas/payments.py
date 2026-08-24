from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from app.models.payments import PaymentIntentStatus, PaymentMethodType, CheckoutSessionStatus

class PaymentIntentCreate(BaseModel):
    amount: int = Field(..., gt=0, description="Amount in integer minor units (e.g., 149900 = ₹1,499.00)")
    currency: str = Field("INR", min_length=3, max_length=3)
    customer_id: Optional[str] = None
    description: Optional[str] = None
    statement_descriptor: Optional[str] = "PAYCORE"
    metadata_json: Optional[Dict[str, Any]] = None

class PaymentIntentConfirm(BaseModel):
    payment_method_type: PaymentMethodType
    payment_details: Dict[str, Any]  # card details or upi vpa

class PaymentIntentResponse(BaseModel):
    id: str
    merchant_id: str
    customer_id: Optional[str] = None
    amount: int
    currency: str
    status: PaymentIntentStatus
    description: Optional[str] = None
    statement_descriptor: Optional[str] = None
    client_secret: str
    selected_payment_method: Optional[str] = None
    captured_amount: int = 0
    refunded_amount: int = 0
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CheckoutSessionCreate(BaseModel):
    amount: int = Field(..., gt=0, description="Amount in integer minor units")
    currency: str = "INR"
    description: Optional[str] = "Purchase Order"
    customer_email: Optional[str] = None
    success_url: str
    cancel_url: str

class CheckoutSessionResponse(BaseModel):
    id: str
    payment_intent_id: str
    merchant_id: str
    customer_email: Optional[str] = None
    amount: int
    currency: str
    description: Optional[str] = None
    success_url: str
    cancel_url: str
    checkout_url: str
    status: CheckoutSessionStatus
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
