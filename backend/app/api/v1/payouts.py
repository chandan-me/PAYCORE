from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.auth_deps import get_current_merchant
from app.models.merchants import Merchant
from app.schemas.settlements_payouts import PayoutCreateRequest, PayoutResponse
from app.services.payout_service import PayoutService

router = APIRouter(prefix="/payouts", tags=["Payouts"])

@router.get("", response_model=List[PayoutResponse])
async def list_payouts(
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    """List all bank payout requests for the current merchant."""
    return await PayoutService.list_payouts(db, merchant.id)

@router.post("", response_model=PayoutResponse, status_code=status.HTTP_201_CREATED)
async def create_payout(
    request: PayoutCreateRequest,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    """Request a bank payout (IMPS / NEFT / RTGS / INSTANT) against available ledger balance."""
    return await PayoutService.create_payout(
        db=db,
        merchant_id=merchant.id,
        amount=request.amount,
        payout_method=request.payout_method,
        bank_account_number=request.bank_account_number,
        bank_ifsc=request.bank_ifsc,
        account_holder_name=request.account_holder_name,
        idempotency_key=request.idempotency_key,
        metadata_json=request.metadata_json
    )
