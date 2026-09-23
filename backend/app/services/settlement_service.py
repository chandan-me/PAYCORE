from datetime import datetime, timezone, timedelta
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.merchants import Merchant
from app.models.ledger import Balance
from app.models.settlements_payouts import Settlement, SettlementBatch, SettlementStatus
from app.models.invoices_notifications import AuditLog

class SettlementService:
    @staticmethod
    async def process_settlement_batch(
        db: AsyncSession,
        settlement_cycle: str = "T+1"
    ) -> SettlementBatch:
        """Processes T+1 or T+2 settlements for all merchants with pending balances."""
        batch = SettlementBatch(
            settlement_cycle=settlement_cycle,
            status=SettlementStatus.PROCESSING
        )
        db.add(batch)
        await db.flush()

        # Query all balances where pending_amount > 0
        result = await db.execute(select(Balance).where(Balance.pending_amount > 0))
        balances = result.scalars().all()

        total_settled = 0
        total_merchants = 0

        for bal in balances:
            pending = bal.pending_amount
            if pending <= 0:
                continue

            # Move PENDING -> AVAILABLE
            bal.pending_amount -= pending
            bal.available_amount += pending
            
            settlement = Settlement(
                batch_id=batch.id,
                merchant_id=bal.merchant_id,
                gross_amount=pending,
                fee_amount=0,
                tax_amount=0,
                refund_deduction=0,
                dispute_deduction=0,
                net_settlement_amount=pending,
                currency=bal.currency,
                status=SettlementStatus.SETTLED,
                settlement_date=datetime.now(timezone.utc),
                utr_number=f"SETT_{datetime.now().strftime('%Y%m%d%H%M%S')}_{bal.merchant_id[:6]}"
            )
            db.add(settlement)
            total_settled += pending
            total_merchants += 1

        batch.total_amount = total_settled
        batch.total_merchants = total_merchants
        batch.status = SettlementStatus.SETTLED
        batch.processed_at = datetime.now(timezone.utc)
        
        audit = AuditLog(
            actor_id="SYSTEM",
            actor_type="SYSTEM",
            action="SETTLEMENT_BATCH_COMPLETED",
            resource_type="SettlementBatch",
            resource_id=batch.id,
            metadata_json={"total_amount": total_settled, "merchants": total_merchants, "cycle": settlement_cycle}
        )
        db.add(audit)
        await db.flush()
        return batch

    @staticmethod
    async def list_merchant_settlements(
        db: AsyncSession,
        merchant_id: str
    ) -> List[Settlement]:
        result = await db.execute(
            select(Settlement).where(Settlement.merchant_id == merchant_id).order_by(Settlement.created_at.desc())
        )
        return result.scalars().all()
