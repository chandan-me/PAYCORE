import hashlib
import json
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.invoices_notifications import IdempotencyKey

class IdempotencyService:
    @classmethod
    async def check_key(
        cls, session: AsyncSession, key: str, merchant_id: str, path: str, request_data: dict
    ) -> Optional[Tuple[int, dict]]:
        request_hash = hashlib.sha256(json.dumps(request_data, sort_keys=True).encode()).hexdigest()
        
        result = await session.execute(
            select(IdempotencyKey).where(
                IdempotencyKey.key == key,
                IdempotencyKey.merchant_id == merchant_id,
                IdempotencyKey.expires_at > datetime.now(timezone.utc)
            )
        )
        record = result.scalar_one_or_none()
        if record:
            return record.response_code, record.response_body
        return None

    @classmethod
    async def save_key(
        cls, session: AsyncSession, key: str, merchant_id: str, path: str, request_data: dict, response_code: int, response_body: dict
    ):
        request_hash = hashlib.sha256(json.dumps(request_data, sort_keys=True).encode()).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
        
        record = IdempotencyKey(
            key=key,
            merchant_id=merchant_id,
            path=path,
            request_hash=request_hash,
            response_code=response_code,
            response_body=response_body,
            expires_at=expires_at
        )
        session.add(record)
        await session.flush()
