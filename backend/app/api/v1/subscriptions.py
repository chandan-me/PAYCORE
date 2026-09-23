from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.auth_deps import get_current_merchant
from app.models.merchants import Merchant
from app.schemas.subscriptions import (
    SubscriptionPlanCreate, SubscriptionPlanResponse,
    SubscriptionCreate, SubscriptionResponse
)
from app.services.subscription_service import SubscriptionService

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

@router.get("/plans", response_model=List[SubscriptionPlanResponse])
async def list_plans(
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    """List all recurring subscription plans for the merchant."""
    return await SubscriptionService.list_plans(db, merchant.id)

@router.post("/plans", response_model=SubscriptionPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_plan(
    plan_in: SubscriptionPlanCreate,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    """Create a new subscription plan (Daily, Weekly, Monthly, Annual)."""
    return await SubscriptionService.create_plan(
        db=db,
        merchant_id=merchant.id,
        name=plan_in.name,
        amount=plan_in.amount,
        currency=plan_in.currency,
        billing_interval=plan_in.billing_interval,
        interval_count=plan_in.interval_count,
        trial_period_days=plan_in.trial_period_days,
        description=plan_in.description
    )

@router.get("", response_model=List[SubscriptionResponse])
async def list_subscriptions(
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    """List all active and historical subscriptions."""
    return await SubscriptionService.list_subscriptions(db, merchant.id)

@router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    sub_in: SubscriptionCreate,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    """Subscribe a customer to a plan with mandate token references."""
    return await SubscriptionService.create_subscription(
        db=db,
        merchant_id=merchant.id,
        plan_id=sub_in.plan_id,
        customer_id=sub_in.customer_id,
        mandate_type=sub_in.mandate_type,
        mandate_token_reference=sub_in.mandate_token_reference,
        total_billing_cycles=sub_in.total_billing_cycles,
        metadata_json=sub_in.metadata_json
    )

@router.post("/{id}/cancel", response_model=SubscriptionResponse)
async def cancel_subscription(
    id: str,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    """Cancel an active subscription."""
    return await SubscriptionService.cancel_subscription(db, merchant.id, id)
