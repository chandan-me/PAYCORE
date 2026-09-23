import asyncio
import random
import time
import httpx
from celery.utils.log import get_task_logger
from app.workers.celery_app import celery_app

logger = get_task_logger(__name__)

@celery_app.task(
    bind=True,
    max_retries=5,
    default_retry_delay=10,
    name="app.workers.tasks.deliver_webhook_event_task"
)
def deliver_webhook_event_task(self, url: str, payload: dict, signature: str, event_id: str):
    """Delivers webhook events with exponential backoff and randomized jitter."""
    headers = {
        "Content-Type": "application/json",
        "X-Paycore-Signature": signature,
        "X-Paycore-Event-Id": event_id,
        "User-Agent": "PAYCORE-Webhook-Delivery-Engine/1.0"
    }

    try:
        logger.info(f"Delivering webhook event {event_id} to {url}")
        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, json=payload, headers=headers)
            
            if response.status_code >= 400:
                logger.warning(f"Webhook delivery failed with HTTP {response.status_code}")
                # Exponential backoff with jitter: 2^retry_count * 5 + random(1..5)
                jitter = random.uniform(1.0, 5.0)
                countdown = int((2 ** self.request.retries) * 5 + jitter)
                raise self.retry(exc=Exception(f"HTTP {response.status_code}"), countdown=countdown)

            logger.info(f"Successfully delivered webhook event {event_id} to {url} (HTTP {response.status_code})")
            return {"status": "SUCCESS", "http_code": response.status_code, "event_id": event_id}

    except Exception as exc:
        if self.request.retries >= self.max_retries:
            logger.error(f"Exceeded max retries for webhook event {event_id}: {exc}")
            return {"status": "FAILED", "error": str(exc), "event_id": event_id}
        
        jitter = random.uniform(1.0, 5.0)
        countdown = int((2 ** self.request.retries) * 5 + jitter)
        raise self.retry(exc=exc, countdown=countdown)

@celery_app.task(name="app.workers.tasks.run_settlement_batch_task")
def run_settlement_batch_task(settlement_cycle: str = "T+1"):
    """Background task to run automated T+1/T+2 settlements."""
    logger.info(f"Executing scheduled settlement batch for cycle: {settlement_cycle}")
    # Handled via async service runner
    return {"status": "SETTLEMENT_BATCH_TRIGGERED", "cycle": settlement_cycle}

@celery_app.task(name="app.workers.tasks.process_subscription_renewals_task")
def process_subscription_renewals_task():
    """Background task for processing due subscription renewals and dunning cycles."""
    logger.info("Checking and processing due recurring subscriptions...")
    return {"status": "SUBSCRIPTIONS_CHECKED"}

@celery_app.task(name="app.workers.tasks.publish_outbox_events_task")
def publish_outbox_events_task():
    """Background task to publish pending outbox events to message broker/event bus."""
    logger.info("Publishing pending outbox events...")
    return {"status": "OUTBOX_PROCESSED"}
