import re
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.models.users import UserRole

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2)
    phone_number: Optional[str] = None
    gstin: Optional[str] = None
    role: UserRole = UserRole.MERCHANT_ADMIN

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long.')
        if not re.search(r"[A-Z]", v):
            raise ValueError('Password must contain at least one uppercase letter.')
        if not re.search(r"[0-9]", v):
            raise ValueError('Password must contain at least one number.')
        return v

    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v: Optional[str]) -> Optional[str]:
        if v:
            clean = re.sub(r'[\s\-\(\)]', '', v)
            if not re.match(r'^\+?[1-9]\d{8,14}$', clean):
                raise ValueError('Invalid phone number format. Please provide a valid phone number (e.g. +91 98765 43210).')
            return clean
        return v

    @field_validator('gstin')
    @classmethod
    def validate_gstin(cls, v: Optional[str]) -> Optional[str]:
        if v:
            v_upper = v.strip().upper()
            if not re.match(r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$', v_upper):
                raise ValueError('Invalid GSTIN / Tax ID format (e.g. 22AAAAA0000A1Z5).')
            return v_upper
        return v

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleLoginRequest(BaseModel):
    google_token: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None

class OTPRequest(BaseModel):
    phone_number: str

class OTPVerifyRequest(BaseModel):
    phone_number: str
    otp_code: str = Field(..., min_length=6, max_length=6)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    role: UserRole
    merchant_id: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone_number: Optional[str] = None
    is_phone_verified: bool
    gstin: Optional[str] = None
    role: UserRole
    is_active: bool
