import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.merchants import Merchant, OnboardingStatus
from app.models.payments import PaymentIntentStatus
from app.models.refunds_disputes import DisputeStatus
from app.services.payment_service import PaymentService
from app.services.dispute_service import DisputeService

@pytest.mark.asyncio
async def test_dispute_evidence_and_resolution(test_db: AsyncSession):
    session = test_db

    mch = Merchant(business_name="Dispute Merchant", support_email="dispute@example.com", onboarding_status=OnboardingStatus.VERIFIED)
    session.add(mch)
    await session.flush()

    intent = await PaymentService.create_payment_intent(
        session,
        merchant_id=mch.id,
        amount=50000,
        currency="INR",
        description="Software Order"
    )

    # 1. Create Dispute
    dispute = await DisputeService.create_dispute(
        session,
        payment_intent_id=intent.id,
        reason="fraudulent"
    )
    assert dispute.status == DisputeStatus.OPEN
    assert dispute.amount == 50000

    # 2. Submit Rebuttal Evidence
    evidence = {
        "customer_name": "John Doe",
        "customer_email": "john@example.com",
        "product_description": "Cloud Subscription",
        "uncategorized_text": "Customer accepted terms during checkout."
    }
    updated = await DisputeService.submit_evidence(session, dispute.id, mch.id, evidence)
    assert updated.status == DisputeStatus.UNDER_REVIEW
    assert updated.evidence_details["customer_name"] == "John Doe"

    # 3. Resolve Dispute as WON
    resolved = await DisputeService.resolve_dispute(session, dispute.id, won=True)
    assert resolved.status == DisputeStatus.WON
