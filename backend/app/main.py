from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.api.v1 import (
    auth, merchants, customers, payment_intents, checkout,
    refunds, disputes, api_keys, webhooks, invoices, admin, simulator, health
)
from app.utils.seed import seed_initial_data

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-Grade Custom Payment Service Platform & Orchestration Layer",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

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
        "version": "1.0.0",
        "documentation": "/docs",
        "health": "/health",
        "status": "OPERATIONAL"
    }
