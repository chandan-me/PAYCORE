import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.auth_deps import get_current_merchant
from app.models.merchants import Merchant
from app.models.webhooks import WebhookEndpoint, WebhookDelivery, WebhookEvent
from app.schemas.webhooks import WebhookEndpointCreate, WebhookEndpointResponse, WebhookDeliveryResponse
from app.services.webhook_service import WebhookService

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

@router.post("/endpoints", response_model=WebhookEndpointResponse, status_code=status.HTTP_201_CREATED)
async def create_webhook_endpoint(
    data: WebhookEndpointCreate,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    secret_key = f"whsec_{uuid.uuid4().hex}"
    ep = WebhookEndpoint(
        merchant_id=merchant.id,
        url=data.url,
        secret=secret_key,
        subscribed_events_json=data.subscribed_events,
        is_active=True
    )
    db.add(ep)
    await db.flush()
    return ep

@router.get("/endpoints", response_model=List[WebhookEndpointResponse])
async def list_webhook_endpoints(
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(WebhookEndpoint).where(WebhookEndpoint.merchant_id == merchant.id).order_by(WebhookEndpoint.created_at.desc())
    )
    return result.scalars().all()

@router.get("/deliveries", response_model=List[WebhookDeliveryResponse])
async def list_webhook_deliveries(
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(WebhookDelivery)
        .join(WebhookEndpoint, WebhookDelivery.webhook_endpoint_id == WebhookEndpoint.id)
        .where(WebhookEndpoint.merchant_id == merchant.id)
        .order_by(WebhookDelivery.created_at.desc())
    )
    return result.scalars().all()

@router.post("/deliveries/{id}/retry")
async def retry_webhook_delivery(
    id: str,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(WebhookDelivery).where(WebhookDelivery.id == id))
    delivery = result.scalar_one_or_none()
    if not delivery:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery log not found.")

    ep_result = await db.execute(select(WebhookEndpoint).where(WebhookEndpoint.id == delivery.webhook_endpoint_id))
    ep = ep_result.scalar_one_or_none()
    evt_result = await db.execute(select(WebhookEvent).where(WebhookEvent.id == delivery.event_id))
    evt = evt_result.scalar_one_or_none()

    if ep and evt:
        await WebhookService._deliver_to_endpoint(db, ep, evt)

    return {"message": "Webhook retry attempt dispatched successfully."}
