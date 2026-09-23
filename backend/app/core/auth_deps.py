from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.core.security import decode_access_token, hash_api_key
from app.models.users import User, UserRole
from app.models.merchants import Merchant, MerchantMember
from app.models.api_keys import APIKey

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/auth/login", auto_error=False)

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Bearer token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
        )
    
    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive.")
    return user

async def get_current_merchant(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Merchant:
    result = await db.execute(
        select(Merchant)
        .join(MerchantMember, Merchant.id == MerchantMember.merchant_id)
        .where(MerchantMember.user_id == current_user.id)
    )
    merchant = result.scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Merchant account not found for current user.")
    return merchant

async def authenticate_api_key(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
) -> Merchant:
    """
    Authenticates merchant API request via Bearer API Key (sk_test_..., sk_live_..., pk_test_...).
    """
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing.")
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Authorization header format. Use 'Bearer <api_key>'.")
    
    raw_key = parts[1]
    hashed_key = hash_api_key(raw_key)

    result = await db.execute(
        select(APIKey).where(APIKey.key_hash == hashed_key, APIKey.is_active == True)
    )
    api_key_obj = result.scalar_one_or_none()
    if not api_key_obj:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or revoked API key.")

    # Fetch corresponding merchant
    mch_result = await db.execute(select(Merchant).where(Merchant.id == api_key_obj.merchant_id))
    merchant = mch_result.scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Merchant associated with API key not found.")

    return merchant

def require_role(allowed_roles: list[UserRole]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles and current_user.role != UserRole.PLATFORM_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Allowed roles: {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker
