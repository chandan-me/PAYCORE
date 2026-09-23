import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.auth_deps import get_current_merchant
from app.models.merchants import Merchant
from app.models.invoices_notifications import Invoice
from app.schemas.invoices import InvoiceCreate, InvoiceResponse
from app.services.invoice_service import InvoiceService

router = APIRouter(prefix="/invoices", tags=["Invoices"])

@router.get("", response_model=List[InvoiceResponse])
async def list_invoices(
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    """List all itemized GST invoices for current merchant."""
    result = await db.execute(
        select(Invoice).where(Invoice.merchant_id == merchant.id).order_by(Invoice.created_at.desc())
    )
    return result.scalars().all()

@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    invoice_in: InvoiceCreate,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    """Create an itemized tax invoice with CGST, SGST, IGST calculations."""
    return await InvoiceService.create_invoice(
        db=db,
        merchant_id=merchant.id,
        customer_name=invoice_in.customer_name,
        line_items=[item.model_dump() for item in invoice_in.line_items],
        currency=invoice_in.currency,
        customer_id=invoice_in.customer_id,
        customer_email=invoice_in.customer_email,
        customer_gstin=invoice_in.customer_gstin,
        customer_address=invoice_in.customer_address,
        is_interstate_tax=invoice_in.is_interstate_tax,
        discount_amount=invoice_in.discount_amount,
        notes=invoice_in.notes,
        terms=invoice_in.terms,
        due_date=invoice_in.due_date
    )

@router.get("/{id}", response_model=InvoiceResponse)
async def get_invoice(
    id: str,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Invoice).where(Invoice.id == id, Invoice.merchant_id == merchant.id))
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")
    return inv

@router.get("/{id}/download-pdf")
async def download_invoice_pdf(
    id: str,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    """Generates and downloads the official PDF Tax Invoice."""
    result = await db.execute(select(Invoice).where(Invoice.id == id, Invoice.merchant_id == merchant.id))
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found.")

    pdf_bytes = InvoiceService.generate_invoice_pdf(inv, merchant.business_name, merchant.gstin)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={inv.invoice_number}.pdf"}
    )
