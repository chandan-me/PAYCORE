import uuid
from datetime import datetime, timezone

def utc_now():
    return datetime.now(timezone.utc)

def generate_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:16]}"

from app.database import Base

# Import all model entities so Base.metadata is fully populated
from app.models.users import User, Session, UserRole
from app.models.merchants import Merchant, MerchantMember, OnboardingStatus, MerchantMode
from app.models.customers import Customer, SavedPaymentMethod
from app.models.payments import PaymentIntent, CheckoutSession, PaymentIntentStatus, PaymentMethodType, CheckoutSessionStatus
from app.models.transactions import Transaction, TransactionType, TransactionStatus
from app.models.ledger import LedgerAccount, LedgerTransaction, LedgerEntry, Balance, LedgerAccountType, EntryType
from app.models.refunds_disputes import Refund, Dispute, RefundStatus, DisputeStatus
from app.models.api_keys import APIKey, APIKeyType, APIKeyMode
from app.models.webhooks import WebhookEndpoint, WebhookEvent, WebhookDelivery, WebhookDeliveryStatus
from app.models.invoices_notifications import Invoice, Notification, AuditLog, RiskEvent, Provider, IdempotencyKey

__all__ = [
    "Base",
    "utc_now",
    "generate_id",
    "User", "Session", "UserRole",
    "Merchant", "MerchantMember", "OnboardingStatus", "MerchantMode",
    "Customer", "SavedPaymentMethod",
    "PaymentIntent", "CheckoutSession", "PaymentIntentStatus", "PaymentMethodType", "CheckoutSessionStatus",
    "Transaction", "TransactionType", "TransactionStatus",
    "LedgerAccount", "LedgerTransaction", "LedgerEntry", "Balance", "LedgerAccountType", "EntryType",
    "Refund", "Dispute", "RefundStatus", "DisputeStatus",
    "APIKey", "APIKeyType", "APIKeyMode",
    "WebhookEndpoint", "WebhookEvent", "WebhookDelivery", "WebhookDeliveryStatus",
    "Invoice", "Notification", "AuditLog", "RiskEvent", "Provider", "IdempotencyKey"
]
