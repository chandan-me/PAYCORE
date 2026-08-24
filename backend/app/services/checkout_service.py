from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.payments import CheckoutSession, PaymentIntent, CheckoutSessionStatus
from app.services.payment_service import PaymentService
from app.config import settings

class CheckoutService:
    @classmethod
    async def create_session(
        cls,
        db: AsyncSession,
        merchant_id: str,
        amount: int,
        currency: str,
        success_url: str,
        cancel_url: str,
        description: Optional[str] = "Purchase Order",
        customer_email: Optional[str] = None
    ) -> CheckoutSession:
        # Create underlying PaymentIntent first
        intent = await PaymentService.create_payment_intent(
            db,
            merchant_id=merchant_id,
            amount=amount,
            currency=currency,
            description=description
        )

        expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)

        session = CheckoutSession(
            payment_intent_id=intent.id,
            merchant_id=merchant_id,
            customer_email=customer_email,
            amount=amount,
            currency=currency,
            description=description,
            success_url=success_url,
            cancel_url=cancel_url,
            status=CheckoutSessionStatus.OPEN,
            expires_at=expires_at
        )
        db.add(session)
        await db.flush()
        return session
