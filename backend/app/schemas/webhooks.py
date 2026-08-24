from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, HttpUrl
from app.models.webhooks import WebhookDeliveryStatus

class WebhookEndpointCreate(BaseModel):
    url: str
    subscribed_events: List[str]  # e.g., ["payment.succeeded", "payment.failed", "refund.created"]

class WebhookEndpointResponse(BaseModel):
    id: str
    merchant_id: str
    url: str
    secret: str
    subscribed_events_json: List[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class WebhookDeliveryResponse(BaseModel):
    id: str
    webhook_endpoint_id: str
    event_id: str
    status: WebhookDeliveryStatus
    http_status_code: Optional[int] = None
    response_body: Optional[str] = None
    attempt_count: int
    latency_ms: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
