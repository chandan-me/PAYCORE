import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config import settings
from app.models.payment_links import PaymentLink, PaymentLinkStatus
from app.models.payments import PaymentIntent, CheckoutSession, PaymentMethodType
from app.models.customers import Customer
from app.services.payment_service import PaymentService
from app.services.checkout_service import CheckoutService

class PaymentLinkService:
    @staticmethod
    async def create_payment_link(
        db: AsyncSession,
        merchant_id: str,
        amount: int,
        title: str,
        currency: str = "INR",
        description: Optional[str] = None,
        customer_id: Optional[str] = None,
        customer_email: Optional[str] = None,
        customer_name: Optional[str] = None,
        allowed_payment_methods: Optional[dict] = None,
        expires_in_days: int = 7,
        metadata_json: Optional[dict] = None
    ) -> PaymentLink:
        # Create Customer if not provided but email exists
        if not customer_id and customer_email:
            cust_res = await db.execute(
                select(Customer).where(Customer.merchant_id == merchant_id, Customer.email == customer_email)
            )
            cust = cust_res.scalar_one_or_none()
            if not cust:
                cust = Customer(
                    merchant_id=merchant_id,
                    email=customer_email,
                    name=customer_name or "Customer"
                )
                db.add(cust)
                await db.flush()
            customer_id = cust.id

        # Create Hosted Checkout Session (which creates underlying PaymentIntent)
        checkout_session = await CheckoutService.create_session(
            db,
            merchant_id=merchant_id,
            amount=amount,
            currency=currency,
            success_url=f"{settings.FRONTEND_URL}/payment/success",
            cancel_url=f"{settings.FRONTEND_URL}/payment/cancel",
            description=description or f"Payment for: {title}",
            customer_email=customer_email
        )

        slug = f"pl_{uuid.uuid4().hex[:12]}"
        short_url = f"{settings.FRONTEND_URL}/checkout/{checkout_session.id}"
        expires_at = datetime.now(timezone.utc) + timedelta(days=expires_in_days)

        plink = PaymentLink(
            merchant_id=merchant_id,
            customer_id=customer_id,
            payment_intent_id=checkout_session.payment_intent_id,
            checkout_session_id=checkout_session.id,
            amount=amount,
            currency=currency,
            title=title,
            description=description,
            slug=slug,
            short_url=short_url,
            status=PaymentLinkStatus.ACTIVE,
            allowed_payment_methods=allowed_payment_methods,
            expires_at=expires_at,
            metadata_json=metadata_json
        )
        db.add(plink)
        await db.flush()
        return plink

    @staticmethod
    async def list_payment_links(db: AsyncSession, merchant_id: str) -> List[PaymentLink]:
        result = await db.execute(
            select(PaymentLink).where(PaymentLink.merchant_id == merchant_id).order_by(PaymentLink.created_at.desc())
        )
        return result.scalars().all()
