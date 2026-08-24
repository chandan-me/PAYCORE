from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import random

from app.database import get_db
from app.services.auth_service import AuthService
from app.schemas.auth import (
    RegisterRequest, LoginRequest, GoogleLoginRequest,
    OTPRequest, OTPVerifyRequest, TokenResponse, UserResponse
)
from app.core.auth_deps import get_current_user
from app.models.users import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory OTP storage for demo sandbox
OTP_CACHE = {}

@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    return await AuthService.register_user(db, req)

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await AuthService.login_user(db, req)

@router.post("/google", response_model=TokenResponse)
async def google_login(req: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    return await AuthService.google_login(db, req)

@router.post("/otp/request")
async def request_otp(req: OTPRequest):
    code = f"{random.randint(100000, 999999)}"
    OTP_CACHE[req.phone_number] = code
    return {
        "status": "SUCCESS",
        "message": f"6-digit OTP code sent to {req.phone_number}",
        "sandbox_otp": code  # Provided for immediate testing in sandbox UI
    }

@router.post("/otp/verify")
async def verify_otp(req: OTPVerifyRequest):
    cached_code = OTP_CACHE.get(req.phone_number)
    if not cached_code or cached_code != req.otp_code:
        # Accept '123456' as sandbox fallback code
        if req.otp_code != "123456":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid 6-digit OTP code. Please check and try again.")
    
    return {"status": "SUCCESS", "message": "Phone number verified successfully!"}

@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return user
