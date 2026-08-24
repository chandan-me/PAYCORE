from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.api_keys import APIKeyType, APIKeyMode

class APIKeyCreate(BaseModel):
    name: str = "Default Key"
    key_type: APIKeyType = APIKeyType.SECRET
    mode: APIKeyMode = APIKeyMode.TEST

class APIKeyResponse(BaseModel):
    id: str
    merchant_id: str
    name: str
    key_type: APIKeyType
    mode: APIKeyMode
    key_prefix: str
    is_active: bool
    last_used_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SecretKeyRevealResponse(BaseModel):
    id: str
    name: str
    key_type: APIKeyType
    mode: APIKeyMode
    secret_key: str  # Revealed ONLY ONCE on creation
    message: str = "Store this secret key securely. It will never be displayed again."
