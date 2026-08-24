from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.auth_deps import get_current_merchant
from app.models.merchants import Merchant
from app.models.payments import PaymentIntent, PaymentIntentStatus, PaymentMethodType
from app.models.refunds_disputes import Dispute, DisputeStatus
from app.services.payment_service import PaymentService
from app.services.refund_service import RefundService

router = APIRouter(prefix="/simulator", tags=["Developer Simulator"])

class SimulateEventRequest(BaseModel):
    event_type: str  # payment_success, payment_failed, refund, dispute
    amount: int = 149900  # Default ₹1,499.00
    description: str = "Test Simulated Transaction"

@router.post("/event")
async def simulate_event(
    req: SimulateEventRequest,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    if req.event_type == "payment_success":
        intent = await PaymentService.create_payment_intent(
            db, merchant_id=merchant.id, amount=req.amount, currency="INR", description=req.description
        )
        confirmed = await PaymentService.confirm_payment_intent(
            db, payment_intent_id=intent.id, payment_method_type=PaymentMethodType.CARD,
            payment_details={"card_number": "4242 4242 4242 4242", "exp_month": 12, "exp_year": 2030, "cvv": "123"}
        )
        return {"status": "SUCCESS", "message": "Simulated successful payment.", "payment_intent_id": confirmed.id}

    elif req.event_type == "payment_failed":
        intent = await PaymentService.create_payment_intent(
            db, merchant_id=merchant.id, amount=req.amount, currency="INR", description=req.description
        )
        failed = await PaymentService.confirm_payment_intent(
            db, payment_intent_id=intent.id, payment_method_type=PaymentMethodType.CARD,
            payment_details={"card_number": "4000 0000 0000 0002", "exp_month": 12, "exp_year": 2030, "cvv": "123"}
        )
        return {"status": "FAILED", "message": "Simulated failed payment (Insufficient Funds).", "payment_intent_id": failed.id}

    elif req.event_type == "dispute":
        # Create a successful payment first then attach dispute
        intent = await PaymentService.create_payment_intent(
            db, merchant_id=merchant.id, amount=req.amount, currency="INR", description="Disputed Purchase"
        )
        await PaymentService.confirm_payment_intent(
            db, payment_intent_id=intent.id, payment_method_type=PaymentMethodType.CARD,
            payment_details={"card_number": "4242 4242 4242 4242"}
        )

        dispute = Dispute(
            payment_intent_id=intent.id,
            merchant_id=merchant.id,
            amount=req.amount,
            currency="INR",
            reason="Fraudulent charge claim",
            status=DisputeStatus.OPEN,
            deadline_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        db.add(dispute)
        await db.flush()
        return {"status": "SUCCESS", "message": "Simulated dispute created.", "dispute_id": dispute.id}

    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported simulation event_type.")
