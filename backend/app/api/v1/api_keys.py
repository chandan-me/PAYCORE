from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.auth_deps import get_current_merchant
from app.models.merchants import Merchant
from app.models.api_keys import APIKey
from app.schemas.api_keys import APIKeyCreate, APIKeyResponse, SecretKeyRevealResponse
from app.services.api_key_service import APIKeyService

router = APIRouter(prefix="/api_keys", tags=["API Keys"])

@router.get("", response_model=List[APIKeyResponse])
async def list_api_keys(
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(APIKey).where(APIKey.merchant_id == merchant.id).order_by(APIKey.created_at.desc())
    )
    return result.scalars().all()

@router.post("", response_model=SecretKeyRevealResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    data: APIKeyCreate,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    api_key_obj, raw_key = await APIKeyService.create_key(
        db,
        merchant_id=merchant.id,
        name=data.name,
        key_type=data.key_type,
        mode=data.mode
    )

    return SecretKeyRevealResponse(
        id=api_key_obj.id,
        name=api_key_obj.name,
        key_type=api_key_obj.key_type,
        mode=api_key_obj.mode,
        secret_key=raw_key,
        message="Store this secret key securely. It will never be displayed again."
    )

@router.delete("/{id}/revoke", response_model=APIKeyResponse)
async def revoke_api_key(
    id: str,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(APIKey).where(APIKey.id == id, APIKey.merchant_id == merchant.id)
    )
    key_obj = result.scalar_one_or_none()
    if not key_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API key not found.")

    key_obj.is_active = False
    await db.flush()
    return key_obj
