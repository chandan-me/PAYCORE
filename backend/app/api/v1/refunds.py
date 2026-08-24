from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.auth_deps import get_current_merchant
from app.core.idempotency import IdempotencyService
from app.models.merchants import Merchant
from app.models.refunds_disputes import Refund
from app.schemas.refunds_disputes import RefundCreate, RefundResponse
from app.services.refund_service import RefundService

router = APIRouter(prefix="/refunds", tags=["Refunds"])

@router.post("", response_model=RefundResponse, status_code=status.HTTP_201_CREATED)
async def create_refund(
    data: RefundCreate,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    if idempotency_key:
        cached = await IdempotencyService.check_key(db, idempotency_key, merchant.id, "/v1/refunds", data.model_dump())
        if cached:
            code, body = cached
            return body

    refund = await RefundService.create_refund(
        db,
        merchant_id=merchant.id,
        payment_intent_id=data.payment_intent_id,
        amount=data.amount,
        reason=data.reason,
        metadata_json=data.metadata_json
    )

    resp_data = RefundResponse.model_validate(refund).model_dump(mode="json")
    if idempotency_key:
        await IdempotencyService.save_key(db, idempotency_key, merchant.id, "/v1/refunds", data.model_dump(), 201, resp_data)

    return refund

@router.get("", response_model=List[RefundResponse])
async def list_refunds(
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Refund).where(Refund.merchant_id == merchant.id).order_by(Refund.created_at.desc())
    )
    return result.scalars().all()
