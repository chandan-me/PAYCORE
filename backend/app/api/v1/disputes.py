from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.auth_deps import get_current_merchant
from app.models.merchants import Merchant
from app.models.refunds_disputes import Dispute, DisputeStatus
from app.schemas.refunds_disputes import DisputeResponse, DisputeEvidenceSubmit

router = APIRouter(prefix="/disputes", tags=["Disputes"])

@router.get("", response_model=List[DisputeResponse])
async def list_disputes(
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Dispute).where(Dispute.merchant_id == merchant.id).order_by(Dispute.created_at.desc())
    )
    return result.scalars().all()

@router.post("/{id}/evidence", response_model=DisputeResponse)
async def submit_dispute_evidence(
    id: str,
    evidence: DisputeEvidenceSubmit,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Dispute).where(Dispute.id == id, Dispute.merchant_id == merchant.id)
    )
    dispute = result.scalar_one_or_none()
    if not dispute:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispute not found.")

    dispute.evidence_details = evidence.model_dump()
    dispute.status = DisputeStatus.UNDER_REVIEW
    await db.flush()
    return dispute
