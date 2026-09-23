from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import redis.asyncio as aioredis

from app.database import get_db
from app.config import settings

router = APIRouter(tags=["Health & Observability"])

@router.get("/health")
async def health_check():
    """Basic liveness probe."""
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "database": "MySQL 8.0+",
        "environment": settings.APP_ENV
    }

@router.get("/live")
async def liveness_probe():
    """Kubernetes / Docker liveness probe."""
    return {"status": "LIVE"}

@router.get("/ready")
async def readiness_probe(db: AsyncSession = Depends(get_db)):
    """Readiness probe checking database and redis connections."""
    db_status = "UNKNOWN"
    redis_status = "UNKNOWN"

    # 1. Check MySQL
    try:
        await db.execute(text("SELECT 1"))
        db_status = "CONNECTED"
    except Exception as e:
        db_status = f"ERROR: {str(e)}"

    # 2. Check Redis
    try:
        r = aioredis.from_url(settings.REDIS_URL, socket_timeout=2.0)
        await r.ping()
        await r.close()
        redis_status = "CONNECTED"
    except Exception as e:
        redis_status = f"ERROR: {str(e)}"

    is_ready = (db_status == "CONNECTED" and redis_status == "CONNECTED")
    status_code = status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=status_code,
        content={
            "status": "READY" if is_ready else "DEGRADED",
            "mysql": db_status,
            "redis": redis_status
        }
    )
