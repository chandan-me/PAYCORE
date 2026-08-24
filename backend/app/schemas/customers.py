from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr

class CustomerCreate(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    external_id: Optional[str] = None
    description: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None

class CustomerResponse(BaseModel):
    id: str
    merchant_id: str
    external_id: Optional[str] = None
    email: str
    name: str
    phone: Optional[str] = None
    description: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
