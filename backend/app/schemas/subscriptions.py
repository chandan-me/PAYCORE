from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field

class SubscriptionPlanCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    amount: int = Field(..., gt=0, description="Plan price in minor units (paise)")
    currency: str = Field(default="INR", min_length=3, max_length=3)
    billing_interval: str = Field(default="MONTHLY", description="DAILY, WEEKLY, MONTHLY, ANNUAL")
    interval_count: int = Field(default=1, ge=1)
    trial_period_days: int = Field(default=0, ge=0)

class SubscriptionPlanResponse(BaseModel):
    id: str
    merchant_id: str
    name: str
    description: Optional[str] = None
    amount: int
    currency: str
    billing_interval: str
    interval_count: int
    trial_period_days: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SubscriptionCreate(BaseModel):
    plan_id: str
    customer_id: str
    mandate_type: str = Field(default="UPI_AUTOPAY", description="UPI_AUTOPAY, E_NACH, CARD_RECURRING")
    mandate_token_reference: Optional[str] = None
    total_billing_cycles: Optional[int] = None
    metadata_json: Optional[dict] = None

class SubscriptionResponse(BaseModel):
    id: str
    merchant_id: str
    plan_id: str
    customer_id: str
    status: str
    mandate_type: str
    mandate_token_reference: Optional[str] = None
    current_period_start: datetime
    current_period_end: datetime
    trial_end: Optional[datetime] = None
    total_billing_cycles: Optional[int] = None
    completed_cycles: int
    failed_renewal_attempts: int
    metadata_json: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
