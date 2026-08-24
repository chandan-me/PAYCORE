from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.auth_deps import get_current_merchant, authenticate_api_key
from app.core.idempotency import IdempotencyService
from app.models.merchants import Merchant
from app.models.payments import PaymentIntent
from app.schemas.payments import PaymentIntentCreate, PaymentIntentConfirm, PaymentIntentResponse
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payment_intents", tags=["Payment Intents"])

async def resolve_merchant(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
) -> Merchant:
    # Authenticate via API Key if Authorization header starts with Bearer sk_ / pk_
    if authorization and ("sk_" in authorization or "pk_" in authorization):
        return await authenticate_api_key(authorization, db)
    # Fallback to session token
    return await get_current_merchant(db=db)

@router.post("", response_model=PaymentIntentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment_intent(
    data: PaymentIntentCreate,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    merchant: Merchant = Depends(resolve_merchant),
    db: AsyncSession = Depends(get_db)
):
    if idempotency_key:
        cached = await IdempotencyService.check_key(db, idempotency_key, merchant.id, "/v1/payment_intents", data.model_dump())
        if cached:
            code, body = cached
            return body

    intent = await PaymentService.create_payment_intent(
        db,
        merchant_id=merchant.id,
        amount=data.amount,
        currency=data.currency,
        customer_id=data.customer_id,
        description=data.description,
        statement_descriptor=data.statement_descriptor,
        metadata_json=data.metadata_json
    )

    resp_data = PaymentIntentResponse.model_validate(intent).model_dump(mode="json")
    if idempotency_key:
        await IdempotencyService.save_key(db, idempotency_key, merchant.id, "/v1/payment_intents", data.model_dump(), 201, resp_data)

    return intent

@router.post("/{id}/confirm", response_model=PaymentIntentResponse)
async def confirm_payment_intent(
    id: str,
    data: PaymentIntentConfirm,
    db: AsyncSession = Depends(get_db)
):
    return await PaymentService.confirm_payment_intent(
        db,
        payment_intent_id=id,
        payment_method_type=data.payment_method_type,
        payment_details=data.payment_details
    )

@router.get("/{id}", response_model=PaymentIntentResponse)
async def get_payment_intent(
    id: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(PaymentIntent).where(PaymentIntent.id == id))
    intent = result.scalar_one_or_none()
    if not intent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment Intent not found.")
    return intent

@router.get("", response_model=List[PaymentIntentResponse])
async def list_payment_intents(
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PaymentIntent)
        .where(PaymentIntent.merchant_id == merchant.id)
        .order_by(PaymentIntent.created_at.desc())
    )
    return result.scalars().all()
