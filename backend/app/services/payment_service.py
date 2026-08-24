import uuid
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.models.merchants import Merchant, MerchantMode
from app.models.payments import PaymentIntent, PaymentIntentStatus, PaymentMethodType, PaymentMode
from app.models.transactions import Transaction, TransactionType, TransactionStatus
from app.models.invoices_notifications import RiskEvent
from app.domain.payment_state_machine import PaymentStateMachine
from app.domain.ledger_engine import LedgerEngine
from app.domain.risk_engine import RiskEngine
from app.providers.router import payment_router
from app.services.webhook_service import WebhookService
from app.services.audit_service import AuditService

class PaymentService:
    @classmethod
    async def create_payment_intent(
        cls,
        db: AsyncSession,
        merchant_id: str,
        amount: int,
        currency: str = "INR",
        customer_id: Optional[str] = None,
        description: Optional[str] = None,
        statement_descriptor: Optional[str] = "PAYCORE",
        metadata_json: Optional[Dict[str, Any]] = None,
        mode: Optional[PaymentMode] = None
    ) -> PaymentIntent:
        # Fetch merchant to resolve environment mode if not specified
        if not mode:
            mch_result = await db.execute(select(Merchant).where(Merchant.id == merchant_id))
            mch = mch_result.scalar_one_or_none()
            mode = PaymentMode.LIVE if mch and mch.environment_mode == MerchantMode.LIVE else PaymentMode.TEST

        client_secret = f"pi_secret_{uuid.uuid4().hex}"

        intent = PaymentIntent(
            merchant_id=merchant_id,
            customer_id=customer_id,
            amount=amount,
            currency=currency.upper(),
            status=PaymentIntentStatus.REQUIRES_PAYMENT_METHOD,
            mode=mode,
            description=description,
            statement_descriptor=statement_descriptor,
            client_secret=client_secret,
            metadata_json=metadata_json or {}
        )
        db.add(intent)
        await db.flush()

        await AuditService.log(
            db, actor_id=merchant_id, actor_type="MERCHANT",
            action="PAYMENT_INTENT_CREATED", resource_type="PaymentIntent", resource_id=intent.id,
            metadata_json={"amount": amount, "currency": currency, "mode": mode.value}
        )

        return intent

    @classmethod
    async def confirm_payment_intent(
        cls,
        db: AsyncSession,
        payment_intent_id: str,
        payment_method_type: PaymentMethodType,
        payment_details: Dict[str, Any]
    ) -> PaymentIntent:
        result = await db.execute(select(PaymentIntent).where(PaymentIntent.id == payment_intent_id))
        intent = result.scalar_one_or_none()
        if not intent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment Intent not found.")

        # 1. State Machine Validation
        PaymentStateMachine.validate_transition(intent.status, PaymentIntentStatus.PROCESSING)
        intent.status = PaymentIntentStatus.PROCESSING
        intent.selected_payment_method = payment_method_type.value
        intent.selected_payment_details = {k: v for k, v in payment_details.items() if "pin" not in k and "cvv" not in k}
        await db.flush()

        # 2. Risk Engine Assessment
        card_num = payment_details.get("card_number", "")
        email = payment_details.get("customer_email", "customer@example.com")
        
        risk = RiskEngine.evaluate_payment(
            amount=intent.amount,
            currency=intent.currency,
            customer_email=email,
            payment_method_type=payment_method_type.value,
            card_number=card_num
        )

        risk_record = RiskEvent(
            payment_intent_id=intent.id,
            merchant_id=intent.merchant_id,
            risk_score=risk.score,
            risk_level=risk.level,
            rules_triggered_json=risk.triggered_rules
        )
        db.add(risk_record)

        if risk.level == "BLOCKED":
            intent.status = PaymentIntentStatus.FAILED
            intent.error_code = "RISK_BLOCKED"
            intent.error_message = "Payment blocked by Risk & Fraud Engine."
            await db.flush()

            await WebhookService.dispatch_event(
                db, merchant_id=intent.merchant_id, event_type="payment.failed",
                payload_data={"payment_intent_id": intent.id, "amount": intent.amount, "reason": "RISK_BLOCKED"}
            )
            return intent

        # 3. Provider Processing (Sandbox vs Real Acquirer)
        provider = payment_router.get_provider("sandbox")
        provider_resp = await provider.process_payment(
            payment_intent_id=intent.id,
            amount=intent.amount,
            currency=intent.currency,
            payment_method_type=payment_method_type.value,
            payment_details=payment_details
        )

        # 4. Create Transaction Record
        platform_fee = int(intent.amount * 0.02)  # 2.0% fee
        net_amount = intent.amount - platform_fee

        txn = Transaction(
            payment_intent_id=intent.id,
            merchant_id=intent.merchant_id,
            customer_id=intent.customer_id,
            amount=intent.amount,
            currency=intent.currency,
            type=TransactionType.PAYMENT,
            status=TransactionStatus.SUCCEEDED if provider_resp.success else TransactionStatus.FAILED,
            mode=intent.mode,
            provider_id=provider.code,
            provider_transaction_id=provider_resp.provider_transaction_id,
            fee_amount=platform_fee,
            net_amount=net_amount,
            error_code=provider_resp.error_code,
            error_message=provider_resp.error_message
        )
        db.add(txn)

        if provider_resp.success:
            PaymentStateMachine.validate_transition(intent.status, PaymentIntentStatus.SUCCEEDED)
            intent.status = PaymentIntentStatus.SUCCEEDED
            intent.captured_amount = intent.amount

            # Record Double-Entry Ledger
            await LedgerEngine.record_payment_capture(
                db,
                merchant_id=intent.merchant_id,
                payment_intent_id=intent.id,
                amount=intent.amount,
                fee_amount=platform_fee,
                currency=intent.currency
            )

            # Webhook Dispatch
            await WebhookService.dispatch_event(
                db,
                merchant_id=intent.merchant_id,
                event_type="payment.succeeded",
                payload_data={
                    "payment_intent_id": intent.id,
                    "amount": intent.amount,
                    "currency": intent.currency,
                    "status": "SUCCEEDED",
                    "mode": intent.mode.value,
                    "provider_transaction_id": provider_resp.provider_transaction_id
                }
            )

            await AuditService.log(
                db, actor_id=intent.merchant_id, actor_type="MERCHANT",
                action="PAYMENT_SUCCEEDED", resource_type="PaymentIntent", resource_id=intent.id,
                metadata_json={"amount": intent.amount, "net_amount": net_amount, "mode": intent.mode.value}
            )
        else:
            intent.status = PaymentIntentStatus.FAILED
            intent.error_code = provider_resp.error_code
            intent.error_message = provider_resp.error_message

            await WebhookService.dispatch_event(
                db,
                merchant_id=intent.merchant_id,
                event_type="payment.failed",
                payload_data={
                    "payment_intent_id": intent.id,
                    "error_code": provider_resp.error_code,
                    "error_message": provider_resp.error_message
                }
            )

        await db.flush()
        return intent
