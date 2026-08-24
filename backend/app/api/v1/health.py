from datetime import datetime, timezone
from fastapi import APIRouter

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    return {
        "status": "UP",
        "service": "PAYCORE Core Payment Engine",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/ready")
async def readiness_check():
    return {
        "status": "READY",
        "database": "READY",
        "sandbox_engine": "READY"
    }
