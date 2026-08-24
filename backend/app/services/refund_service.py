from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.payments import PaymentIntent, PaymentIntentStatus
from app.models.refunds_disputes import Refund, RefundStatus
from app.models.transactions import Transaction, TransactionType, TransactionStatus
from app.domain.payment_state_machine import PaymentStateMachine
from app.domain.ledger_engine import LedgerEngine
from app.providers.router import payment_router
from app.services.webhook_service import WebhookService
from app.services.audit_service import AuditService

class RefundService:
    @classmethod
    async def create_refund(
        cls,
        db: AsyncSession,
        merchant_id: str,
        payment_intent_id: str,
        amount: int,
        reason: Optional[str] = "Requested by customer",
        metadata_json: Optional[Dict[str, Any]] = None
    ) -> Refund:
        # Fetch Payment Intent
        result = await db.execute(
            select(PaymentIntent).where(
                PaymentIntent.id == payment_intent_id,
                PaymentIntent.merchant_id == merchant_id
            )
        )
        intent = result.scalar_one_or_none()
        if not intent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment Intent not found for this merchant.")

        if intent.status not in [PaymentIntentStatus.SUCCEEDED, PaymentIntentStatus.PARTIALLY_REFUNDED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot refund payment in state '{intent.status.value}'. Must be SUCCEEDED or PARTIALLY_REFUNDED."
            )

        refundable_limit = intent.captured_amount - intent.refunded_amount
        if amount > refundable_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Requested refund amount ({amount}) exceeds remaining refundable amount ({refundable_limit})."
            )

        refund = Refund(
            payment_intent_id=intent.id,
            merchant_id=merchant_id,
            amount=amount,
            currency=intent.currency,
            reason=reason,
            status=RefundStatus.PROCESSING,
            metadata_json=metadata_json or {}
        )
        db.add(refund)
        await db.flush()

        # Call Provider Refund Adapter
        provider = payment_router.get_provider("sandbox")
        provider_resp = await provider.process_refund(
            refund_id=refund.id,
            payment_intent_id=intent.id,
            amount=amount,
            currency=intent.currency
        )

        if provider_resp.success:
            refund.status = RefundStatus.SUCCEEDED
            intent.refunded_amount += amount

            # Target status transition
            if intent.refunded_amount >= intent.captured_amount:
                target_status = PaymentIntentStatus.REFUNDED
            else:
                target_status = PaymentIntentStatus.PARTIALLY_REFUNDED

            PaymentStateMachine.validate_transition(intent.status, target_status)
            intent.status = target_status

            # Transaction Record
            txn = Transaction(
                payment_intent_id=intent.id,
                refund_id=refund.id,
                merchant_id=merchant_id,
                customer_id=intent.customer_id,
                amount=amount,
                currency=intent.currency,
                type=TransactionType.REFUND,
                status=TransactionStatus.SUCCEEDED,
                provider_id=provider.code,
                provider_transaction_id=provider_resp.provider_transaction_id,
                fee_amount=0,
                net_amount=-amount
            )
            db.add(txn)

            # Ledger Reversal Entry
            await LedgerEngine.record_refund(
                db,
                merchant_id=merchant_id,
                refund_id=refund.id,
                amount=amount,
                currency=intent.currency
            )

            # Webhook Dispatch
            await WebhookService.dispatch_event(
                db,
                merchant_id=merchant_id,
                event_type="refund.succeeded",
                payload_data={
                    "refund_id": refund.id,
                    "payment_intent_id": intent.id,
                    "amount": amount,
                    "status": "SUCCEEDED"
                }
            )

            await AuditService.log(
                db, actor_id=merchant_id, actor_type="MERCHANT",
                action="REFUND_SUCCEEDED", resource_type="Refund", resource_id=refund.id,
                metadata_json={"amount": amount, "payment_intent_id": intent.id}
            )
        else:
            refund.status = RefundStatus.FAILED
            await WebhookService.dispatch_event(
                db,
                merchant_id=merchant_id,
                event_type="refund.failed",
                payload_data={"refund_id": refund.id, "payment_intent_id": intent.id}
            )

        await db.flush()
        return refund
