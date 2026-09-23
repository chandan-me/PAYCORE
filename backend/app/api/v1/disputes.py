from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.auth_deps import get_current_merchant
from app.models.merchants import Merchant
from app.models.refunds_disputes import Dispute, DisputeStatus
from app.schemas.refunds_disputes import DisputeResponse, DisputeEvidenceSubmit
from app.services.dispute_service import DisputeService

router = APIRouter(prefix="/disputes", tags=["Disputes"])

@router.get("", response_model=List[DisputeResponse])
async def list_disputes(
    status_filter: Optional[str] = None,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    """List all disputes for current merchant with optional status filtering."""
    query = select(Dispute).where(Dispute.merchant_id == merchant.id)
    if status_filter:
        if status_filter.upper() in DisputeStatus.__members__:
            query = query.where(Dispute.status == DisputeStatus[status_filter.upper()])
    query = query.order_by(Dispute.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{id}", response_model=DisputeResponse)
async def get_dispute(
    id: str,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    """Get dispute details including evidence submission history."""
    result = await db.execute(select(Dispute).where(Dispute.id == id, Dispute.merchant_id == merchant.id))
    dispute = result.scalar_one_or_none()
    if not dispute:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispute not found.")
    return dispute

@router.post("/{id}/evidence", response_model=DisputeResponse)
async def submit_dispute_evidence(
    id: str,
    evidence: DisputeEvidenceSubmit,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    """Submit rebuttal evidence (receipts, tracking numbers, notes) for a dispute before deadline."""
    return await DisputeService.submit_evidence(
        db=db,
        dispute_id=id,
        merchant_id=merchant.id,
        evidence=evidence.model_dump()
    )

@router.post("/{id}/resolve", response_model=DisputeResponse)
async def resolve_dispute(
    id: str,
    won: bool,
    db: AsyncSession = Depends(get_db)
):
    """Admin endpoint to resolve a dispute as WON or LOST."""
    return await DisputeService.resolve_dispute(db=db, dispute_id=id, won=won)
