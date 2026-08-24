import uuid
from typing import Dict, Any
from app.providers.base import PaymentProvider, ProviderResponse

class SandboxPaymentProvider(PaymentProvider):
    @property
    def code(self) -> str:
        return "sandbox"

    async def process_payment(
        self,
        payment_intent_id: str,
        amount: int,
        currency: str,
        payment_method_type: str,
        payment_details: Dict[str, Any]
    ) -> ProviderResponse:
        provider_txn_id = f"sbx_txn_{uuid.uuid4().hex[:14]}"

        # Test scenarios based on card number or UPI VPA
        if payment_method_type == "CARD":
            card_number = payment_details.get("card_number", "").replace(" ", "")
            if card_number.endswith("0002"):
                return ProviderResponse(
                    success=False,
                    status="FAILED",
                    provider_transaction_id=provider_txn_id,
                    error_code="INSUFFICIENT_FUNDS",
                    error_message="The card has insufficient funds."
                )
            elif card_number.endswith("0003"):
                return ProviderResponse(
                    success=False,
                    status="FAILED",
                    provider_transaction_id=provider_txn_id,
                    error_code="EXPIRED_CARD",
                    error_message="The card has expired."
                )
            elif card_number.endswith("0004"):
                return ProviderResponse(
                    success=False,
                    status="FAILED",
                    provider_transaction_id=provider_txn_id,
                    error_code="GATEWAY_TIMEOUT",
                    error_message="Payment gateway timed out during processing."
                )
            elif card_number.endswith("0005"):
                return ProviderResponse(
                    success=False,
                    status="FAILED",
                    provider_transaction_id=provider_txn_id,
                    error_code="PAYMENT_DECLINED",
                    error_message="The payment was declined by issuing bank."
                )

        elif payment_method_type == "UPI":
            upi_vpa = payment_details.get("upi_vpa", "").lower()
            if "fail" in upi_vpa:
                return ProviderResponse(
                    success=False,
                    status="FAILED",
                    provider_transaction_id=provider_txn_id,
                    error_code="UPI_PIN_INVALID",
                    error_message="Invalid UPI PIN entered by customer."
                )

        # Default Success
        return ProviderResponse(
            success=True,
            status="SUCCEEDED",
            provider_transaction_id=provider_txn_id,
            raw_response={"message": "Sandbox payment processed successfully", "sandbox": True}
        )

    async def process_refund(
        self,
        refund_id: str,
        payment_intent_id: str,
        amount: int,
        currency: str
    ) -> ProviderResponse:
        provider_txn_id = f"sbx_ref_{uuid.uuid4().hex[:14]}"
        return ProviderResponse(
            success=True,
            status="SUCCEEDED",
            provider_transaction_id=provider_txn_id,
            raw_response={"message": "Sandbox refund processed successfully", "sandbox": True}
        )
