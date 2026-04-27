"""Local stub for emergentintegrations.payments.stripe.checkout."""
from pydantic import BaseModel
from typing import Optional, Dict, Any


class CheckoutSessionRequest(BaseModel):
    amount: float
    currency: str = "usd"
    success_url: str
    cancel_url: str
    metadata: Dict[str, Any] = {}


class CheckoutSessionResponse(BaseModel):
    session_id: str
    url: str


class CheckoutStatusResponse(BaseModel):
    session_id: str
    payment_status: str
    status: str


class StripeCheckout:
    def __init__(self, api_key: str, webhook_url: str = ""):
        self.api_key = api_key
        self.webhook_url = webhook_url

    async def create_checkout_session(self, req: CheckoutSessionRequest) -> CheckoutSessionResponse:
        import httpx
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/x-www-form-urlencoded",
        }
        data = {
            "mode": "payment",
            "success_url": req.success_url,
            "cancel_url": req.cancel_url,
            "line_items[0][price_data][currency]": req.currency,
            "line_items[0][price_data][unit_amount]": str(int(req.amount * 100)),
            "line_items[0][price_data][product_data][name]": "Hujjah Subscription",
            "line_items[0][quantity]": "1",
        }
        for k, v in req.metadata.items():
            data[f"metadata[{k}]"] = str(v)
        if self.webhook_url:
            data["payment_intent_data[metadata][webhook_url]"] = self.webhook_url

        async with httpx.AsyncClient() as client:
            r = await client.post(
                "https://api.stripe.com/v1/checkout/sessions",
                headers=headers,
                data=data,
            )
        if r.status_code != 200:
            raise RuntimeError(f"Stripe error {r.status_code}: {r.text[:300]}")
        body = r.json()
        return CheckoutSessionResponse(session_id=body["id"], url=body["url"])

    async def get_checkout_status(self, session_id: str) -> CheckoutStatusResponse:
        import httpx
        headers = {"Authorization": f"Bearer {self.api_key}"}
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"https://api.stripe.com/v1/checkout/sessions/{session_id}",
                headers=headers,
            )
        if r.status_code != 200:
            raise RuntimeError(f"Stripe error {r.status_code}: {r.text[:300]}")
        body = r.json()
        return CheckoutStatusResponse(
            session_id=body["id"],
            payment_status=body.get("payment_status", "unpaid"),
            status=body.get("status", "open"),
        )

    async def handle_webhook(self, body: bytes, signature: str) -> CheckoutStatusResponse:
        import json as _json
        try:
            event = _json.loads(body)
        except Exception:
            raise RuntimeError("Invalid webhook payload")
        obj = event.get("data", {}).get("object", {})
        return CheckoutStatusResponse(
            session_id=obj.get("id", ""),
            payment_status=obj.get("payment_status", "unpaid"),
            status=obj.get("status", "open"),
        )
