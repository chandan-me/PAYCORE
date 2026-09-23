import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.merchants import Merchant, OnboardingStatus
from app.services.invoice_service import InvoiceService
from app.services.payment_link_service import PaymentLinkService

@pytest.mark.asyncio
async def test_invoice_creation_and_pdf(test_db: AsyncSession):
    session = test_db

    mch = Merchant(business_name="Invoice Corp", support_email="billing@invoicecorp.com", gstin="29AAAAA0000A1Z5", onboarding_status=OnboardingStatus.VERIFIED)
    session.add(mch)
    await session.flush()

    line_items = [
        {"description": "Pro Tier Subscription", "quantity": 2, "unit_price": 50000, "tax_rate_percent": 18.0}
    ]

    invoice = await InvoiceService.create_invoice(
        session,
        merchant_id=mch.id,
        customer_name="Alice Smith",
        customer_email="alice@example.com",
        line_items=line_items,
        is_interstate_tax=False
    )

    assert invoice.subtotal == 100000  # 2 * 50000
    assert invoice.tax_amount == 18000 # 18% of 100000
    assert invoice.cgst_amount == 9000
    assert invoice.sgst_amount == 9000
    assert invoice.total_amount == 118000

    # Test PDF generation
    pdf_bytes = InvoiceService.generate_invoice_pdf(invoice, mch.business_name, mch.gstin)
    assert pdf_bytes is not None
    assert len(pdf_bytes) > 0
    assert pdf_bytes.startswith(b"%PDF")

@pytest.mark.asyncio
async def test_payment_link_flow(test_db: AsyncSession):
    session = test_db

    mch = Merchant(business_name="Link Merchant", support_email="link@example.com", onboarding_status=OnboardingStatus.VERIFIED)
    session.add(mch)
    await session.flush()

    plink = await PaymentLinkService.create_payment_link(
        session,
        merchant_id=mch.id,
        amount=250000,
        title="Consulting Retainer",
        customer_email="client@example.com"
    )

    assert plink.id.startswith("plink_")
    assert plink.amount == 250000
    assert plink.slug.startswith("pl_")
    assert "/checkout/" in plink.short_url
