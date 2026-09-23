import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.merchants import Merchant, OnboardingStatus
from app.models.customers import Customer
from app.models.subscriptions import SubscriptionStatus, BillingInterval
from app.services.subscription_service import SubscriptionService

@pytest.mark.asyncio
async def test_subscription_lifecycle(test_db: AsyncSession):
    session = test_db

    mch = Merchant(business_name="SaaS Platform", support_email="support@saas.com", onboarding_status=OnboardingStatus.VERIFIED)
    session.add(mch)
    await session.flush()

    cust = Customer(merchant_id=mch.id, email="sub_user@example.com", name="Subscriber")
    session.add(cust)
    await session.flush()

    # 1. Create Plan
    plan = await SubscriptionService.create_plan(
        session,
        merchant_id=mch.id,
        name="Growth Monthly",
        amount=199900,
        billing_interval="MONTHLY",
        trial_period_days=14
    )
    assert plan.amount == 199900
    assert plan.billing_interval == BillingInterval.MONTHLY
    assert plan.trial_period_days == 14

    # 2. Subscribe Customer
    sub = await SubscriptionService.create_subscription(
        session,
        merchant_id=mch.id,
        plan_id=plan.id,
        customer_id=cust.id,
        mandate_type="UPI_AUTOPAY"
    )
    assert sub.status == SubscriptionStatus.TRIALING
    assert sub.trial_end is not None

    # 3. Cancel Subscription
    cancelled = await SubscriptionService.cancel_subscription(session, mch.id, sub.id)
    assert cancelled.status == SubscriptionStatus.CANCELLED
