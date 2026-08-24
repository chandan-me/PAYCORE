import uuid
from typing import Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.api_keys import APIKey, APIKeyType, APIKeyMode
from app.core.security import hash_api_key

class APIKeyService:
    @classmethod
    async def create_key(
        cls,
        db: AsyncSession,
        merchant_id: str,
        name: str = "Default Key",
        key_type: APIKeyType = APIKeyType.SECRET,
        mode: APIKeyMode = APIKeyMode.TEST
    ) -> Tuple[APIKey, str]:
        prefix_str = "pk" if key_type == APIKeyType.PUBLISHABLE else "sk"
        env_str = "test" if mode == APIKeyMode.TEST else "live"
        random_suffix = uuid.uuid4().hex + uuid.uuid4().hex[:16]
        
        raw_key = f"{prefix_str}_{env_str}_{random_suffix}"
        key_prefix = raw_key[:12]
        key_hash = hash_api_key(raw_key)

        api_key_obj = APIKey(
            merchant_id=merchant_id,
            key_type=key_type,
            mode=mode,
            name=name,
            key_prefix=key_prefix,
            key_hash=key_hash,
            is_active=True
        )
        db.add(api_key_obj)
        await db.flush()

        return api_key_obj, raw_key
