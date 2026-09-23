from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class ProviderResponse:
    success: bool
    status: str  # SUCCEEDED, FAILED, PENDING, CANCELLED
    provider_transaction_id: str
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    raw_response: Optional[Dict[str, Any]] = None

@dataclass
class PayoutResponse:
    success: bool
    status: str  # SUCCEEDED, FAILED, PENDING
    provider_payout_id: str
    utr: Optional[str] = None
    error_message: Optional[str] = None
    raw_response: Optional[Dict[str, Any]] = None

class PaymentProvider(ABC):
    @property
    @abstractmethod
    def code(self) -> str:
        pass

    @abstractmethod
    async def process_payment(
        self,
        payment_intent_id: str,
        amount: int,
        currency: str,
        payment_method_type: str,
        payment_details: Dict[str, Any]
    ) -> ProviderResponse:
        """Process or initiate a payment charge."""
        pass

    @abstractmethod
    async def process_refund(
        self,
        refund_id: str,
        payment_intent_id: str,
        amount: int,
        currency: str
    ) -> ProviderResponse:
        """Process full or partial refund with provider."""
        pass

    async def verify_webhook(self, payload: bytes, signature: str, secret: str) -> bool:
        """Verify webhook signature from provider."""
        return False

    async def create_mandate(self, customer_id: str, mandate_type: str, details: Dict[str, Any]) -> ProviderResponse:
        """Create recurring mandate (UPI AutoPay, e-NACH, card token)."""
        return ProviderResponse(
            success=False,
            status="FAILED",
            provider_transaction_id="",
            error_message=f"Mandate creation not supported for provider {self.code}"
        )

    async def create_payout(self, payout_id: str, amount: int, bank_account: str, ifsc: str) -> PayoutResponse:
        """Execute bank payout."""
        return PayoutResponse(
            success=False,
            status="FAILED",
            provider_payout_id="",
            error_message=f"Payouts not supported for provider {self.code}"
        )
