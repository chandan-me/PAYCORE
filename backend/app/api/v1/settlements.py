from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.auth_deps import get_current_merchant
from app.models.merchants import Merchant
from app.schemas.settlements_payouts import SettlementResponse
from app.services.settlement_service import SettlementService

router = APIRouter(prefix="/settlements", tags=["Settlements"])

@router.get("", response_model=List[SettlementResponse])
async def list_settlements(
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    """List all settlement records for the current merchant."""
    return await SettlementService.list_merchant_settlements(db, merchant.id)

@router.post("/process-batch", response_model=dict)
async def trigger_settlement_batch(
    settlement_cycle: str = "T+1",
    db: AsyncSession = Depends(get_db)
):
    """Trigger automated T+1 or T+2 settlement batch (Admin / System)."""
    batch = await SettlementService.process_settlement_batch(db, settlement_cycle)
    return {
        "batch_id": batch.id,
        "status": batch.status.value,
        "total_amount": batch.total_amount,
        "total_merchants": batch.total_merchants
    }
