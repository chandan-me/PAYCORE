from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.auth_deps import get_current_merchant
from app.models.merchants import Merchant
from app.schemas.payment_links import PaymentLinkCreate, PaymentLinkResponse
from app.services.payment_link_service import PaymentLinkService

router = APIRouter(prefix="/payment-links", tags=["Payment Links"])

@router.get("", response_model=List[PaymentLinkResponse])
async def list_payment_links(
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    """List all payment links created by the merchant."""
    return await PaymentLinkService.list_payment_links(db, merchant.id)

@router.post("", response_model=PaymentLinkResponse, status_code=status.HTTP_201_CREATED)
async def create_payment_link(
    link_in: PaymentLinkCreate,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    """Create a shareable hosted payment link integrating with Payment Intents and Checkout."""
    return await PaymentLinkService.create_payment_link(
        db=db,
        merchant_id=merchant.id,
        amount=link_in.amount,
        title=link_in.title,
        currency=link_in.currency,
        description=link_in.description,
        customer_id=link_in.customer_id,
        customer_email=link_in.customer_email,
        customer_name=link_in.customer_name,
        allowed_payment_methods=link_in.allowed_payment_methods,
        expires_in_days=link_in.expires_in_days or 7,
        metadata_json=link_in.metadata_json
    )
