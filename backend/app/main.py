import time
import uuid
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.api.v1 import (
    auth, merchants, customers, payment_intents, checkout,
    refunds, disputes, api_keys, webhooks, invoices, admin, simulator, health,
    settlements, payouts, subscriptions, payment_links
)
from app.utils.seed import seed_initial_data

logging.basicConfig(
    level=logging.INFO,
    format='{"time": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s"}'
)
logger = logging.getLogger("paycore")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-Grade Custom Payment Service Platform & Orchestration Layer (MySQL 8.0+)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Structured Logging & Correlation ID Middleware
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", f"req_{uuid.uuid4().hex[:12]}")
    correlation_id = request.headers.get("X-Correlation-ID", request_id)
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = (time.time() - start_time) * 1000.0
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Correlation-ID"] = correlation_id
    
    logger.info(
        f'{{"request_id": "{request_id}", "correlation_id": "{correlation_id}", '
        f'"method": "{request.method}", "path": "{request.url.path}", '
        f'"status_code": {response.status_code}, "latency_ms": {process_time:.2f}}}'
    )
    return response

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under both /v1 and /api/v1
for prefix_str in ["/v1", "/api/v1"]:
    app.include_router(auth.router, prefix=prefix_str)
    app.include_router(merchants.router, prefix=prefix_str)
    app.include_router(customers.router, prefix=prefix_str)
    app.include_router(payment_intents.router, prefix=prefix_str)
    app.include_router(checkout.router, prefix=prefix_str)
    app.include_router(refunds.router, prefix=prefix_str)
    app.include_router(disputes.router, prefix=prefix_str)
    app.include_router(api_keys.router, prefix=prefix_str)
    app.include_router(webhooks.router, prefix=prefix_str)
    app.include_router(invoices.router, prefix=prefix_str)
    app.include_router(payment_links.router, prefix=prefix_str)
    app.include_router(settlements.router, prefix=prefix_str)
    app.include_router(payouts.router, prefix=prefix_str)
    app.include_router(subscriptions.router, prefix=prefix_str)
    app.include_router(admin.router, prefix=prefix_str)
    app.include_router(simulator.router, prefix=prefix_str)

app.include_router(health.router)

@app.on_event("startup")
async def startup_event():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_initial_data()

@app.get("/")
async def root():
    return {
        "platform": settings.PROJECT_NAME,
        "database": "MySQL 8.0+",
        "version": "1.0.0",
        "documentation": "/docs",
        "health": "/health",
        "status": "OPERATIONAL"
    }
