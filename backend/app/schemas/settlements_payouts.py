from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field

class SettlementResponse(BaseModel):
    id: str
    batch_id: Optional[str] = None
    merchant_id: str
    gross_amount: int
    fee_amount: int
    tax_amount: int
    refund_deduction: int
    dispute_deduction: int
    net_settlement_amount: int
    currency: str
    status: str
    settlement_date: datetime
    utr_number: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PayoutCreateRequest(BaseModel):
    amount: int = Field(..., gt=0, description="Payout amount in minor units (paise)")
    currency: str = Field(default="INR", min_length=3, max_length=3)
    payout_method: str = Field(default="IMPS", description="IMPS, NEFT, RTGS, or INSTANT")
    bank_account_number: str = Field(..., min_length=6, max_length=34)
    bank_ifsc: str = Field(..., min_length=4, max_length=20)
    account_holder_name: str = Field(..., min_length=2, max_length=255)
    idempotency_key: Optional[str] = None
    metadata_json: Optional[dict] = None

class PayoutResponse(BaseModel):
    id: str
    merchant_id: str
    batch_id: Optional[str] = None
    amount: int
    fee_amount: int
    currency: str
    payout_method: str
    status: str
    bank_account_number: str
    bank_ifsc: str
    account_holder_name: str
    utr: Optional[str] = None
    provider_reference: Optional[str] = None
    failure_reason: Optional[str] = None
    idempotency_key: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
