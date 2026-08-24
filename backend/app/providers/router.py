from typing import Dict
from app.providers.base import PaymentProvider
from app.providers.sandbox_provider import SandboxPaymentProvider

class PaymentRouter:
    def __init__(self):
        self._providers: Dict[str, PaymentProvider] = {
            "sandbox": SandboxPaymentProvider()
        }

    def get_provider(self, code: str = "sandbox") -> PaymentProvider:
        provider = self._providers.get(code)
        if not provider:
            # Fallback to sandbox provider
            return self._providers["sandbox"]
        return provider

payment_router = PaymentRouter()
