from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from app.models.refunds_disputes import RefundStatus, DisputeStatus

class RefundCreate(BaseModel):
    payment_intent_id: str
    amount: int = Field(..., gt=0, description="Refund amount in integer minor units")
    reason: Optional[str] = "Requested by customer"
    metadata_json: Optional[Dict[str, Any]] = None

class RefundResponse(BaseModel):
    id: str
    payment_intent_id: str
    merchant_id: str
    amount: int
    currency: str
    reason: Optional[str] = None
    status: RefundStatus
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DisputeEvidenceSubmit(BaseModel):
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    product_description: Optional[str] = None
    shipping_tracking_number: Optional[str] = None
    uncategorized_text: Optional[str] = None

class DisputeResponse(BaseModel):
    id: str
    payment_intent_id: str
    merchant_id: str
    amount: int
    currency: str
    reason: str
    status: DisputeStatus
    evidence_details: Optional[Dict[str, Any]] = None
    deadline_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
