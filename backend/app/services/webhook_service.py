import json
import time
import httpx
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.webhooks import WebhookEndpoint, WebhookEvent, WebhookDelivery, WebhookDeliveryStatus
from app.core.security import generate_webhook_signature

class WebhookService:
    @classmethod
    async def dispatch_event(
        cls,
        db: AsyncSession,
        merchant_id: str,
        event_type: str,
        payload_data: Dict[str, Any]
    ):
        # 1. Create WebhookEvent
        evt = WebhookEvent(
            merchant_id=merchant_id,
            event_type=event_type,
            payload_json=payload_data
        )
        db.add(evt)
        await db.flush()

        # 2. Find active endpoints for merchant subscribed to event_type
        result = await db.execute(
            select(WebhookEndpoint).where(
                WebhookEndpoint.merchant_id == merchant_id,
                WebhookEndpoint.is_active == True
            )
        )
        endpoints = result.scalars().all()

        for ep in endpoints:
            subscribed = ep.subscribed_events_json or []
            if event_type in subscribed or "*" in subscribed:
                await cls._deliver_to_endpoint(db, ep, evt)

    @classmethod
    async def _deliver_to_endpoint(
        cls,
        db: AsyncSession,
        endpoint: WebhookEndpoint,
        event: WebhookEvent
    ):
        payload_str = json.dumps(event.payload_json, sort_keys=True)
        signature = generate_webhook_signature(payload_str, endpoint.secret)

        headers = {
            "Content-Type": "application/json",
            "User-Agent": "PAYCORE-Webhook/1.0",
            "X-Paycore-Signature": signature,
            "X-Paycore-Event-Id": event.id,
            "X-Paycore-Event-Type": event.event_type,
        }

        start_time = time.time()
        status_code = None
        resp_body = None
        delivery_status = WebhookDeliveryStatus.FAILED

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(endpoint.url, content=payload_str, headers=headers)
                status_code = resp.status_code
                resp_body = resp.text[:1000]
                if 200 <= status_code < 300:
                    delivery_status = WebhookDeliveryStatus.SUCCESS
        except Exception as e:
            resp_body = f"Webhook dispatch error: {str(e)}"

        latency = int((time.time() - start_time) * 1000)

        delivery = WebhookDelivery(
            webhook_endpoint_id=endpoint.id,
            event_id=event.id,
            status=delivery_status,
            http_status_code=status_code,
            response_body=resp_body,
            attempt_count=1,
            latency_ms=latency
        )
        db.add(delivery)
        await db.flush()
