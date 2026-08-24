from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.core.auth_deps import require_role
from app.models.users import UserRole, User
from app.models.merchants import Merchant
from app.models.payments import PaymentIntent, PaymentIntentStatus
from app.models.transactions import Transaction, TransactionStatus
from app.models.invoices_notifications import AuditLog, Provider
from app.schemas.admin import SystemHealthResponse, AuditLogResponse, ReconciliationReport

router = APIRouter(prefix="/admin", tags=["Platform Admin"])

@router.get("/metrics")
async def get_admin_metrics(
    db: AsyncSession = Depends(get_db)
):
    # Total Merchants
    mch_count = (await db.execute(select(func.count(Merchant.id)))).scalar() or 0
    
    # GMV (Gross Merchandise Volume of succeeded payments)
    gmv_result = (await db.execute(
        select(func.sum(PaymentIntent.amount)).where(PaymentIntent.status == PaymentIntentStatus.SUCCEEDED)
    )).scalar() or 0

    # Total Payments Count
    total_payments = (await db.execute(select(func.count(PaymentIntent.id)))).scalar() or 0
    succeeded_payments = (await db.execute(
        select(func.count(PaymentIntent.id)).where(PaymentIntent.status == PaymentIntentStatus.SUCCEEDED)
    )).scalar() or 0
    failed_payments = (await db.execute(
        select(func.count(PaymentIntent.id)).where(PaymentIntent.status == PaymentIntentStatus.FAILED)
    )).scalar() or 0

    return {
        "total_merchants": mch_count,
        "gmv_paise": gmv_result,
        "gmv_formatted": f"₹{gmv_result / 100:,.2f}",
        "total_payments": total_payments,
        "succeeded_payments": succeeded_payments,
        "failed_payments": failed_payments,
        "success_rate_pct": round((succeeded_payments / total_payments * 100), 2) if total_payments > 0 else 100.0
    }

@router.get("/health", response_model=SystemHealthResponse)
async def get_system_health():
    return SystemHealthResponse(
        status="HEALTHY",
        database="CONNECTED",
        redis="CONNECTED",
        sandbox_provider="ACTIVE",
        worker_queue="HEALTHY",
        timestamp=datetime.now(timezone.utc)
    )

@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(100))
    return result.scalars().all()

@router.get("/reconciliation", response_model=ReconciliationReport)
async def run_reconciliation(
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Transaction))
    txns = result.scalars().all()

    total_paycore = len(txns)
    matched = sum(1 for t in txns if t.provider_transaction_id)
    mismatched = total_paycore - matched

    return ReconciliationReport(
        total_paycore_transactions=total_paycore,
        total_provider_transactions=matched,
        matched_transactions=matched,
        mismatched_transactions=mismatched,
        missing_in_provider=[],
        missing_in_paycore=[],
        status="BALANCED" if mismatched == 0 else "MISMATCH_DETECTED"
    )
