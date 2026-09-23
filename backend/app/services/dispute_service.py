from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.refunds_disputes import Dispute, DisputeStatus
from app.models.payments import PaymentIntent
from app.models.invoices_notifications import AuditLog

class DisputeService:
    @staticmethod
    async def create_dispute(
        db: AsyncSession,
        payment_intent_id: str,
        reason: str = "fraudulent",
        evidence_days: int = 7
    ) -> Dispute:
        intent_res = await db.execute(
            select(PaymentIntent).where(PaymentIntent.id == payment_intent_id)
        )
        intent = intent_res.scalar_one_or_none()
        if not intent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment Intent not found.")

        deadline = datetime.now(timezone.utc) + timedelta(days=evidence_days)
        dispute = Dispute(
            payment_intent_id=intent.id,
            merchant_id=intent.merchant_id,
            amount=intent.amount,
            currency=intent.currency,
            reason=reason,
            status=DisputeStatus.OPEN,
            deadline_at=deadline
        )
        db.add(dispute)
        await db.flush()
        return dispute

    @staticmethod
    async def submit_evidence(
        db: AsyncSession,
        dispute_id: str,
        merchant_id: str,
        evidence: Dict[str, Any]
    ) -> Dispute:
        res = await db.execute(
            select(Dispute).where(Dispute.id == dispute_id, Dispute.merchant_id == merchant_id)
        )
        dispute = res.scalar_one_or_none()
        if not dispute:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispute not found.")

        dispute.evidence_details = evidence
        dispute.status = DisputeStatus.UNDER_REVIEW
        
        audit = AuditLog(
            actor_id=merchant_id,
            actor_type="MERCHANT",
            action="DISPUTE_EVIDENCE_SUBMITTED",
            resource_type="Dispute",
            resource_id=dispute.id,
            metadata_json={"evidence_keys": list(evidence.keys())}
        )
        db.add(audit)
        await db.flush()
        return dispute

    @staticmethod
    async def resolve_dispute(
        db: AsyncSession,
        dispute_id: str,
        won: bool
    ) -> Dispute:
        res = await db.execute(select(Dispute).where(Dispute.id == dispute_id))
        dispute = res.scalar_one_or_none()
        if not dispute:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispute not found.")

        dispute.status = DisputeStatus.WON if won else DisputeStatus.LOST
        await db.flush()
        return dispute
