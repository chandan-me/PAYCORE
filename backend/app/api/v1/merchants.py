from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.auth_deps import get_current_user, get_current_merchant
from app.models.merchants import Merchant, OnboardingStatus, MerchantMode
from app.models.ledger import Balance
from app.schemas.merchants import MerchantResponse, MerchantUpdate, MerchantOnboardingProgress

router = APIRouter(prefix="/merchants", tags=["Merchants"])

class ModeSetRequest(BaseModel):
    mode: MerchantMode

@router.get("/me", response_model=MerchantResponse)
async def get_my_merchant(merchant: Merchant = Depends(get_current_merchant)):
    return merchant

@router.patch("/me", response_model=MerchantResponse)
async def update_merchant(
    data: MerchantUpdate,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(merchant, field, val)
    await db.flush()
    return merchant

@router.post("/onboarding/step", response_model=MerchantResponse)
async def advance_onboarding_step(
    progress: MerchantOnboardingProgress,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    merchant.onboarding_step = min(progress.step, 6)
    if merchant.onboarding_step == 6:
        merchant.onboarding_status = OnboardingStatus.VERIFIED
    elif merchant.onboarding_step > 1:
        merchant.onboarding_status = OnboardingStatus.UNDER_REVIEW

    if progress.data:
        for k, v in progress.data.items():
            if hasattr(merchant, k) and v is not None:
                setattr(merchant, k, v)

    await db.flush()
    return merchant

@router.post("/mode", response_model=MerchantResponse)
async def set_merchant_mode(
    req: ModeSetRequest,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    merchant.environment_mode = req.mode
    await db.flush()
    return merchant

@router.post("/mode/toggle", response_model=MerchantResponse)
async def toggle_merchant_mode(
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    merchant.environment_mode = MerchantMode.LIVE if merchant.environment_mode == MerchantMode.TEST else MerchantMode.TEST
    await db.flush()
    return merchant

@router.get("/balances")
async def get_merchant_balances(
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Balance).where(Balance.merchant_id == merchant.id))
    bal = result.scalar_one_or_none()

    if not bal:
        return {
            "merchant_id": merchant.id,
            "currency": "INR",
            "available_amount": 0,
            "pending_amount": 0,
            "reserved_amount": 0,
            "total_amount": 0
        }

    return {
        "merchant_id": merchant.id,
        "currency": bal.currency,
        "available_amount": bal.available_amount,
        "pending_amount": bal.pending_amount,
        "reserved_amount": bal.reserved_amount,
        "total_amount": bal.available_amount + bal.pending_amount + bal.reserved_amount
    }
