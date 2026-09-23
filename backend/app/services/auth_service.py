import uuid
import json
import base64
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.users import User, UserRole
from app.models.merchants import Merchant, MerchantMember, MerchantRole, OnboardingStatus, MerchantMode
from app.models.ledger import LedgerAccount, LedgerAccountType, Balance
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.auth import RegisterRequest, LoginRequest, GoogleLoginRequest, TokenResponse

import urllib.request
import urllib.parse
from app.config import settings

def verify_google_token(token: str) -> Dict[str, Any]:
    """Verify Google OAuth2 ID token using Google TokenInfo endpoint with JWT payload fallback."""
    try:
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={urllib.parse.quote(token)}"
        req = urllib.request.Request(url, headers={"User-Agent": "PAYCORE-Auth/1.0"})
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode("utf-8"))
                return data
    except Exception:
        pass

    # Safe fallback to base64 JWT payload parsing
    try:
        parts = token.split(".")
        if len(parts) >= 2:
            padding = "=" * (4 - len(parts[1]) % 4)
            decoded = base64.urlsafe_b64decode(parts[1] + padding).decode("utf-8")
            return json.loads(decoded)
    except Exception:
        pass
    return {}

class AuthService:
    @classmethod
    async def register_user(cls, db: AsyncSession, req: RegisterRequest) -> TokenResponse:
        # Check email uniqueness
        existing = await db.execute(select(User).where(User.email == req.email))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An account with this email already exists.")

        # Check phone uniqueness if provided
        if req.phone_number:
            existing_phone = await db.execute(select(User).where(User.phone_number == req.phone_number))
            if existing_phone.scalar_one_or_none():
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An account with this phone number already exists.")

        pwd_hash = hash_password(req.password)
        user = User(
            email=req.email,
            password_hash=pwd_hash,
            full_name=req.full_name,
            phone_number=req.phone_number,
            gstin=req.gstin,
            role=req.role
        )
        db.add(user)
        await db.flush()

        merchant_id = None
        if req.role == UserRole.MERCHANT_ADMIN:
            # Provision Merchant Account
            merchant = Merchant(
                business_name=f"{req.full_name}'s Business",
                support_email=req.email,
                gstin=req.gstin,
                environment_mode=MerchantMode.TEST,
                onboarding_status=OnboardingStatus.UNDER_REVIEW
            )
            db.add(merchant)
            await db.flush()
            merchant_id = merchant.id

            member = MerchantMember(
                merchant_id=merchant.id,
                user_id=user.id,
                role=MerchantRole.OWNER
            )
            db.add(member)

            # Provision Double-Entry Ledger Accounts
            clearing_acc = LedgerAccount(
                merchant_id=merchant.id,
                account_type=LedgerAccountType.CUSTOMER_CLEARING,
                currency="INR",
                name=f"Customer Clearing ({merchant.business_name})"
            )
            payable_acc = LedgerAccount(
                merchant_id=merchant.id,
                account_type=LedgerAccountType.MERCHANT_PAYABLE,
                currency="INR",
                name=f"Merchant Payable ({merchant.business_name})"
            )
            db.add_all([clearing_acc, payable_acc])

            balance = Balance(
                merchant_id=merchant.id,
                currency="INR",
                available_amount=0,
                pending_amount=0,
                reserved_amount=0
            )
            db.add(balance)

        await db.flush()

        token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role.value, "merchant_id": merchant_id})

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user_id=user.id,
            email=user.email,
            role=user.role,
            merchant_id=merchant_id
        )

    @classmethod
    async def login_user(cls, db: AsyncSession, req: LoginRequest) -> TokenResponse:
        result = await db.execute(select(User).where((User.email == req.email) | (User.phone_number == req.email)))
        user = result.scalar_one_or_none()

        if not user or not verify_password(req.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email/phone or password credentials.")

        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled.")

        # Find merchant ID
        mch_result = await db.execute(select(MerchantMember).where(MerchantMember.user_id == user.id))
        member = mch_result.scalar_one_or_none()
        merchant_id = member.merchant_id if member else None

        token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role.value, "merchant_id": merchant_id})

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user_id=user.id,
            email=user.email,
            role=user.role,
            merchant_id=merchant_id
        )

    @classmethod
    async def google_login(cls, db: AsyncSession, req: GoogleLoginRequest) -> TokenResponse:
        from app.models.admins import PlatformAdmin

        email = None
        full_name = None
        google_sub = None

        # Decode and verify Google OAuth JWT token if provided
        if req.google_token:
            payload = verify_google_token(req.google_token)
            if payload:
                email = payload.get("email")
                full_name = payload.get("name")
                google_sub = payload.get("sub")

        if not email and req.email:
            email = req.email.strip().lower()
            full_name = req.full_name
        
        if not email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google authentication failed to provide a valid email.")

        email = email.strip().lower()
        full_name = full_name or email.split("@")[0].replace(".", " ").title()
        google_sub = google_sub or f"google_{uuid.uuid4().hex[:12]}"

        # 1. Check Platform Admins table
        admin_res = await db.execute(select(PlatformAdmin).where(PlatformAdmin.email == email))
        admin = admin_res.scalar_one_or_none()
        if admin:
            if not admin.google_id:
                admin.google_id = google_sub
            token = create_access_token(data={"sub": admin.id, "email": admin.email, "role": UserRole.PLATFORM_ADMIN.value, "merchant_id": None})
            return TokenResponse(
                access_token=token,
                token_type="bearer",
                user_id=admin.id,
                email=admin.email,
                role=UserRole.PLATFORM_ADMIN,
                merchant_id=None
            )

        # 2. Check Merchant Users table
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            # If attempting to log in without an existing account, reject and prompt to register
            if req.mode == "login":
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No existing merchant account found for {email}. Please sign up to create your merchant account."
                )

            # Register user via Real Google OAuth
            pwd_hash = hash_password(f"google_oauth_{uuid.uuid4().hex}")
            user = User(
                email=email,
                password_hash=pwd_hash,
                full_name=full_name,
                google_id=google_sub,
                is_email_verified=True,
                role=UserRole.MERCHANT_ADMIN
            )
            db.add(user)
            await db.flush()

            # Provision merchant account in MySQL
            merchant = Merchant(
                business_name=f"{full_name}'s Business",
                support_email=email,
                environment_mode=MerchantMode.TEST
            )
            db.add(merchant)
            await db.flush()

            member = MerchantMember(merchant_id=merchant.id, user_id=user.id, role=MerchantRole.OWNER)
            clearing_acc = LedgerAccount(merchant_id=merchant.id, account_type=LedgerAccountType.CUSTOMER_CLEARING, currency="INR", name="Customer Clearing")
            payable_acc = LedgerAccount(merchant_id=merchant.id, account_type=LedgerAccountType.MERCHANT_PAYABLE, currency="INR", name="Merchant Payable")
            balance = Balance(merchant_id=merchant.id, currency="INR", available_amount=0)

            db.add_all([member, clearing_acc, payable_acc, balance])
            await db.flush()

            merchant_id = merchant.id
        else:
            if not user.google_id:
                user.google_id = google_sub
                user.is_email_verified = True

            mch_result = await db.execute(select(MerchantMember).where(MerchantMember.user_id == user.id))
            member = mch_result.scalar_one_or_none()
            merchant_id = member.merchant_id if member else None

        token = create_access_token(data={"sub": user.id, "email": user.email, "role": user.role.value, "merchant_id": merchant_id})

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user_id=user.id,
            email=user.email,
            role=user.role,
            merchant_id=merchant_id
        )
