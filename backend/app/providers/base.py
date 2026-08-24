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
        pass

    @abstractmethod
    async def process_refund(
        self,
        refund_id: str,
        payment_intent_id: str,
        amount: int,
        currency: str
    ) -> ProviderResponse:
        pass
