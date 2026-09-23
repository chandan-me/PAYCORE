import hmac
import hashlib
import json
import bcrypt
from datetime import datetime, timedelta, timezone
import jwt
from app.config import settings

def hash_password(password: str) -> str:
    # Truncate to 72 bytes as required by standard bcrypt specification
    pw_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pw_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pw_bytes = plain_password.encode('utf-8')[:72]
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pw_bytes, hash_bytes)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return {}

def hash_api_key(secret_key: str) -> str:
    """Hash secret API keys (sk_test_... / sk_live_...) using SHA-256 with server key."""
    return hashlib.sha256(f"{secret_key}:{settings.PAYCORE_ENCRYPTION_KEY}".encode()).hexdigest()

def generate_webhook_signature(payload_str: str, secret: str) -> str:
    """Generate HMAC SHA-256 signature for merchant webhook delivery."""
    signature = hmac.new(
        secret.encode('utf-8'),
        payload_str.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return f"t={int(datetime.now(timezone.utc).timestamp())},v1={signature}"
