from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.auth_deps import get_current_merchant, authenticate_api_key
from app.models.merchants import Merchant
from app.models.payments import CheckoutSession, PaymentIntent
from app.schemas.payments import CheckoutSessionCreate, CheckoutSessionResponse
from app.services.checkout_service import CheckoutService
from app.config import settings

router = APIRouter(prefix="/checkout", tags=["Hosted Checkout"])

async def resolve_checkout_merchant(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
) -> Merchant:
    if authorization and ("sk_" in authorization or "pk_" in authorization):
        return await authenticate_api_key(authorization, db)
    return await get_current_merchant(db=db)

@router.post("/sessions", response_model=CheckoutSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_checkout_session(
    data: CheckoutSessionCreate,
    merchant: Merchant = Depends(resolve_checkout_merchant),
    db: AsyncSession = Depends(get_db)
):
    session = await CheckoutService.create_session(
        db,
        merchant_id=merchant.id,
        amount=data.amount,
        currency=data.currency,
        success_url=data.success_url,
        cancel_url=data.cancel_url,
        description=data.description,
        customer_email=data.customer_email
    )

    checkout_url = f"{settings.FRONTEND_URL}/checkout/{session.id}"

    return CheckoutSessionResponse(
        id=session.id,
        payment_intent_id=session.payment_intent_id,
        merchant_id=session.merchant_id,
        customer_email=session.customer_email,
        amount=session.amount,
        currency=session.currency,
        description=session.description,
        success_url=session.success_url,
        cancel_url=session.cancel_url,
        checkout_url=checkout_url,
        status=session.status,
        expires_at=session.expires_at,
        created_at=session.created_at
    )

@router.get("/sessions/{id}")
async def get_checkout_session(
    id: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(CheckoutSession).where(CheckoutSession.id == id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checkout session not found.")

    mch_result = await db.execute(select(Merchant).where(Merchant.id == session.merchant_id))
    merchant = mch_result.scalar_one_or_none()

    pi_result = await db.execute(select(PaymentIntent).where(PaymentIntent.id == session.payment_intent_id))
    payment_intent = pi_result.scalar_one_or_none()

    return {
        "session": CheckoutSessionResponse(
            id=session.id,
            payment_intent_id=session.payment_intent_id,
            merchant_id=session.merchant_id,
            customer_email=session.customer_email,
            amount=session.amount,
            currency=session.currency,
            description=session.description,
            success_url=session.success_url,
            cancel_url=session.cancel_url,
            checkout_url=f"{settings.FRONTEND_URL}/checkout/{session.id}",
            status=session.status,
            expires_at=session.expires_at,
            created_at=session.created_at
        ),
        "merchant": {
            "business_name": merchant.business_name if merchant else "PAYCORE Merchant",
            "branding_color": merchant.branding_color if merchant else "#4F46E5",
            "branding_logo_url": merchant.branding_logo_url if merchant else None
        },
        "payment_intent": {
            "id": payment_intent.id,
            "client_secret": payment_intent.client_secret,
            "status": payment_intent.status.value,
            "amount": payment_intent.amount,
            "currency": payment_intent.currency
        }
    }
