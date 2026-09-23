from typing import Dict
from app.providers.base import PaymentProvider
from app.providers.sandbox_provider import SandboxPaymentProvider
from app.providers.razorpay_provider import RazorpayPaymentProvider
from app.providers.stripe_provider import StripePaymentProvider
from app.providers.payu_provider import PayUPaymentProvider
from app.providers.cashfree_provider import CashfreePaymentProvider

class ProviderRouter:
    def __init__(self):
        self._providers: Dict[str, PaymentProvider] = {
            "sandbox": SandboxPaymentProvider(),
            "razorpay": RazorpayPaymentProvider(),
            "stripe": StripePaymentProvider(),
            "payu": PayUPaymentProvider(),
            "cashfree": CashfreePaymentProvider()
        }

    def get_provider(self, code: str = "sandbox") -> PaymentProvider:
        return self._providers.get(code.lower(), self._providers["sandbox"])

    def list_available_providers(self) -> list[str]:
        return list(self._providers.keys())

# Global singleton router instance
payment_router = ProviderRouter()
