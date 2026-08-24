from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.merchants import OnboardingStatus, MerchantMode

class MerchantCreate(BaseModel):
    business_name: str
    legal_business_name: Optional[str] = None
    business_email: EmailStr
    phone: Optional[str] = None
    business_type: Optional[str] = "Private Limited"
    country: str = "IN"
    state: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    website: Optional[str] = None
    tax_id: Optional[str] = None
    business_description: Optional[str] = None

class MerchantUpdate(BaseModel):
    business_name: Optional[str] = None
    legal_business_name: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    tax_id: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    branding_color: Optional[str] = None

class MerchantOnboardingProgress(BaseModel):
    step: int  # 1 to 6
    status: OnboardingStatus
    data: Optional[dict] = None

class MerchantResponse(BaseModel):
    id: str
    business_name: str
    legal_business_name: Optional[str] = None
    business_email: str
    phone: Optional[str] = None
    business_type: Optional[str] = None
    country: str
    state: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    website: Optional[str] = None
    tax_id: Optional[str] = None
    business_description: Optional[str] = None
    onboarding_status: OnboardingStatus
    onboarding_step: int
    environment_mode: MerchantMode
    branding_logo_url: Optional[str] = None
    branding_color: str
    created_at: datetime

    class Config:
        from_attributes = True
