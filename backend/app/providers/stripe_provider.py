import hmac
import hashlib
import time
import httpx
from typing import Dict, Any, Optional
from app.config import settings
from app.providers.base import PaymentProvider, ProviderResponse

class StripePaymentProvider(PaymentProvider):
    """Production Stripe Gateway Adapter supporting PaymentIntents, Webhooks, and Refunds."""
    
    @property
    def code(self) -> str:
        return "stripe"

    def _get_headers(self):
        secret_key = settings.STRIPE_SECRET_KEY
        if not secret_key:
            return None
        return {
            "Authorization": f"Bearer {secret_key}",
            "Content-Type": "application/x-www-form-urlencoded"
        }

    async def process_payment(
        self,
        payment_intent_id: str,
        amount: int,
        currency: str,
        payment_method_type: str,
        payment_details: Dict[str, Any]
    ) -> ProviderResponse:
        headers = self._get_headers()
        if not headers:
            return ProviderResponse(
                success=False,
                status="FAILED",
                provider_transaction_id="",
                error_code="PROVIDER_CREDENTIALS_MISSING",
                error_message="Stripe credentials (STRIPE_SECRET_KEY) not configured in environment."
            )

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                data = {
                    "amount": str(amount),
                    "currency": currency.lower(),
                    "payment_method_types[]": "card",
                    "metadata[payment_intent_id]": payment_intent_id
                }
                resp = await client.post("https://api.stripe.com/v1/payment_intents", data=data, headers=headers)
                res_data = resp.json()

                if resp.status_code == 200:
                    status = "SUCCEEDED" if res_data.get("status") == "succeeded" else "PROCESSING"
                    return ProviderResponse(
                        success=True,
                        status=status,
                        provider_transaction_id=res_data.get("id", f"pi_{payment_intent_id}"),
                        raw_response=res_data
                    )
                else:
                    return ProviderResponse(
                        success=False,
                        status="FAILED",
                        provider_transaction_id="",
                        error_code=res_data.get("error", {}).get("code", "STRIPE_ERROR"),
                        error_message=res_data.get("error", {}).get("message", "Failed to create Stripe PaymentIntent"),
                        raw_response=res_data
                    )
        except Exception as e:
            return ProviderResponse(
                success=False,
                status="FAILED",
                provider_transaction_id="",
                error_code="GATEWAY_TIMEOUT",
                error_message=f"Stripe connection error: {str(e)}"
            )

    async def process_refund(
        self,
        refund_id: str,
        payment_intent_id: str,
        amount: int,
        currency: str
    ) -> ProviderResponse:
        headers = self._get_headers()
        if not headers:
            return ProviderResponse(
                success=False,
                status="FAILED",
                provider_transaction_id="",
                error_code="PROVIDER_CREDENTIALS_MISSING",
                error_message="Stripe credentials not configured in environment."
            )

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                data = {
                    "payment_intent": payment_intent_id,
                    "amount": str(amount),
                    "metadata[refund_id]": refund_id
                }
                resp = await client.post("https://api.stripe.com/v1/refunds", data=data, headers=headers)
                res_data = resp.json()

                if resp.status_code == 200:
                    return ProviderResponse(
                        success=True,
                        status="SUCCEEDED",
                        provider_transaction_id=res_data.get("id", f"re_{refund_id}"),
                        raw_response=res_data
                    )
                else:
                    return ProviderResponse(
                        success=False,
                        status="FAILED",
                        provider_transaction_id="",
                        error_code="REFUND_FAILED",
                        error_message=res_data.get("error", {}).get("message", "Stripe refund failed"),
                        raw_response=res_data
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
            # Parse Stripe-Signature header: t=...,v1=...
            sig_dict = {}
            for item in signature.split(','):
                k, v = item.split('=', 1)
                sig_dict[k.strip()] = v.strip()
            
            timestamp = sig_dict.get('t', '')
            sig = sig_dict.get('v1', '')
            signed_payload = f"{timestamp}.".encode('utf-8') + payload
            expected = hmac.new(secret.encode('utf-8'), signed_payload, hashlib.sha256).hexdigest()
            return hmac.compare_digest(expected, sig)
        except Exception:
            return False
