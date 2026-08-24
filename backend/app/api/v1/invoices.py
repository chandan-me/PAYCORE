import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.auth_deps import get_current_merchant
from app.models.merchants import Merchant
from app.models.invoices_notifications import Invoice

router = APIRouter(prefix="/invoices", tags=["Invoices"])

@router.get("")
async def list_invoices(
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Invoice).where(Invoice.merchant_id == merchant.id).order_by(Invoice.created_at.desc())
    )
    return result.scalars().all()

@router.get("/{id}")
async def get_invoice(
    id: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Invoice).where(Invoice.id == id))
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")
    return inv
