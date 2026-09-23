from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.subscriptions import SubscriptionPlan, Subscription, SubscriptionStatus, BillingInterval, MandateType
from app.models.invoices_notifications import AuditLog

class SubscriptionService:
    @staticmethod
    async def create_plan(
        db: AsyncSession,
        merchant_id: str,
        name: str,
        amount: int,
        currency: str = "INR",
        billing_interval: str = "MONTHLY",
        interval_count: int = 1,
        trial_period_days: int = 0,
        description: Optional[str] = None
    ) -> SubscriptionPlan:
        interval_enum = BillingInterval[billing_interval.upper()] if billing_interval.upper() in BillingInterval.__members__ else BillingInterval.MONTHLY
        plan = SubscriptionPlan(
            merchant_id=merchant_id,
            name=name,
            description=description,
            amount=amount,
            currency=currency,
            billing_interval=interval_enum,
            interval_count=interval_count,
            trial_period_days=trial_period_days
        )
        db.add(plan)
        await db.flush()
        return plan

    @staticmethod
    async def list_plans(db: AsyncSession, merchant_id: str) -> List[SubscriptionPlan]:
        result = await db.execute(
            select(SubscriptionPlan).where(SubscriptionPlan.merchant_id == merchant_id).order_by(SubscriptionPlan.created_at.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def create_subscription(
        db: AsyncSession,
        merchant_id: str,
        plan_id: str,
        customer_id: str,
        mandate_type: str = "UPI_AUTOPAY",
        mandate_token_reference: Optional[str] = None,
        total_billing_cycles: Optional[int] = None,
        metadata_json: Optional[dict] = None
    ) -> Subscription:
        # Fetch plan
        plan_res = await db.execute(
            select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id, SubscriptionPlan.merchant_id == merchant_id)
        )
        plan = plan_res.scalar_one_or_none()
        if not plan:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription plan not found.")

        now = datetime.now(timezone.utc)
        trial_end = None
        period_start = now
        
        if plan.trial_period_days > 0:
            trial_end = now + timedelta(days=plan.trial_period_days)
            period_end = trial_end
            sub_status = SubscriptionStatus.TRIALING
        else:
            sub_status = SubscriptionStatus.ACTIVE
            if plan.billing_interval == BillingInterval.DAILY:
                period_end = now + timedelta(days=plan.interval_count)
            elif plan.billing_interval == BillingInterval.WEEKLY:
                period_end = now + timedelta(weeks=plan.interval_count)
            elif plan.billing_interval == BillingInterval.ANNUAL:
                period_end = now + timedelta(days=365 * plan.interval_count)
            else:
                period_end = now + timedelta(days=30 * plan.interval_count)

        mandate_enum = MandateType[mandate_type.upper()] if mandate_type.upper() in MandateType.__members__ else MandateType.UPI_AUTOPAY
        
        subscription = Subscription(
            merchant_id=merchant_id,
            plan_id=plan_id,
            customer_id=customer_id,
            status=sub_status,
            mandate_type=mandate_enum,
            mandate_token_reference=mandate_token_reference or f"tok_{mandate_type.lower()}_{customer_id[:8]}",
            current_period_start=period_start,
            current_period_end=period_end,
            trial_end=trial_end,
            total_billing_cycles=total_billing_cycles,
            completed_cycles=0,
            metadata_json=metadata_json
        )
        db.add(subscription)
        await db.flush()
        
        audit = AuditLog(
            actor_id=merchant_id,
            actor_type="MERCHANT",
            action="SUBSCRIPTION_CREATED",
            resource_type="Subscription",
            resource_id=subscription.id,
            metadata_json={"plan_id": plan_id, "customer_id": customer_id}
        )
        db.add(audit)
        await db.flush()
        return subscription

    @staticmethod
    async def list_subscriptions(db: AsyncSession, merchant_id: str) -> List[Subscription]:
        result = await db.execute(
            select(Subscription).where(Subscription.merchant_id == merchant_id).order_by(Subscription.created_at.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def cancel_subscription(db: AsyncSession, merchant_id: str, subscription_id: str) -> Subscription:
        res = await db.execute(
            select(Subscription).where(Subscription.id == subscription_id, Subscription.merchant_id == merchant_id)
        )
        sub = res.scalar_one_or_none()
        if not sub:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription not found.")
        sub.status = SubscriptionStatus.CANCELLED
        await db.flush()
        return sub
