import hmac
import hashlib
import httpx
from typing import Dict, Any, Optional
from app.config import settings
from app.providers.base import PaymentProvider, ProviderResponse, PayoutResponse

class RazorpayPaymentProvider(PaymentProvider):
    """Production Razorpay Gateway Adapter supporting Orders, Payments, Webhook verification, and Refunds."""
    
    @property
    def code(self) -> str:
        return "razorpay"

    def _get_auth(self):
        key_id = settings.RAZORPAY_KEY_ID
        key_secret = settings.RAZORPAY_KEY_SECRET
        if not key_id or not key_secret:
            return None
        return (key_id, key_secret)

    async def process_payment(
        self,
        payment_intent_id: str,
        amount: int,
        currency: str,
        payment_method_type: str,
        payment_details: Dict[str, Any]
    ) -> ProviderResponse:
        auth = self._get_auth()
        if not auth:
            # When live credentials are not configured in environment, fail cleanly with appropriate error mapping
            return ProviderResponse(
                success=False,
                status="FAILED",
                provider_transaction_id="",
                error_code="PROVIDER_CREDENTIALS_MISSING",
                error_message="Razorpay credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) not configured in environment."
            )

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                # Razorpay Order creation
                payload = {
                    "amount": amount,
                    "currency": currency,
                    "receipt": payment_intent_id,
                    "notes": {"payment_intent_id": payment_intent_id}
                }
                resp = await client.post("https://api.razorpay.com/v1/orders", json=payload, auth=auth)
                data = resp.json()
                
                if resp.status_code in [200, 201]:
                    return ProviderResponse(
                        success=True,
                        status="PROCESSING",
                        provider_transaction_id=data.get("id", f"order_{payment_intent_id}"),
                        raw_response=data
                    )
                else:
                    return ProviderResponse(
                        success=False,
                        status="FAILED",
                        provider_transaction_id="",
                        error_code=data.get("error", {}).get("code", "RAZORPAY_ERROR"),
                        error_message=data.get("error", {}).get("description", "Failed to initiate Razorpay order"),
                        raw_response=data
                    )
        except Exception as e:
            return ProviderResponse(
                success=False,
                status="FAILED",
                provider_transaction_id="",
                error_code="GATEWAY_TIMEOUT",
                error_message=f"Razorpay connection error: {str(e)}"
            )

    async def process_refund(
        self,
        refund_id: str,
        payment_intent_id: str,
        amount: int,
        currency: str
    ) -> ProviderResponse:
        auth = self._get_auth()
        if not auth:
            return ProviderResponse(
                success=False,
                status="FAILED",
                provider_transaction_id="",
                error_code="PROVIDER_CREDENTIALS_MISSING",
                error_message="Razorpay credentials not configured in environment."
            )

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    f"https://api.razorpay.com/v1/payments/{payment_intent_id}/refund",
                    json={"amount": amount, "notes": {"refund_id": refund_id}},
                    auth=auth
                )
                data = resp.json()
                if resp.status_code in [200, 201]:
                    return ProviderResponse(
                        success=True,
                        status="SUCCEEDED",
                        provider_transaction_id=data.get("id", f"rfnd_{refund_id}"),
                        raw_response=data
                    )
                else:
                    return ProviderResponse(
                        success=False,
                        status="FAILED",
                        provider_transaction_id="",
                        error_code="REFUND_FAILED",
                        error_message=data.get("error", {}).get("description", "Razorpay refund failed"),
                        raw_response=data
                    )
        except Exception as e:
            return ProviderResponse(
                success=False,
                status="FAILED",
                provider_transaction_id="",
                error_code="REFUND_ERROR",
                error_message=str(e)
            )

    async def verify_webhook(self, payload: bytes, signature: str, secret: str) -> bool:
        try:
            expected = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()
            return hmac.compare_digest(expected, signature)
        except Exception:
            return False
