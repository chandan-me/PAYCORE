import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

from app.models.invoices_notifications import Invoice, AuditLog
from app.models.merchants import Merchant
from app.models.customers import Customer

class InvoiceService:
    @staticmethod
    async def create_invoice(
        db: AsyncSession,
        merchant_id: str,
        customer_name: str,
        line_items: List[Dict[str, Any]],
        currency: str = "INR",
        customer_id: Optional[str] = None,
        customer_email: Optional[str] = None,
        customer_gstin: Optional[str] = None,
        customer_address: Optional[str] = None,
        is_interstate_tax: bool = False,
        discount_amount: int = 0,
        notes: Optional[str] = None,
        terms: Optional[str] = None,
        due_date: Optional[datetime] = None
    ) -> Invoice:
        # Calculate subtotal and tax amounts
        subtotal = 0
        total_tax = 0
        computed_items = []

        for item in line_items:
            qty = int(item.get("quantity", 1))
            unit_price = int(item.get("unit_price", 0))  # minor units
            tax_rate = float(item.get("tax_rate_percent", 18.0))
            
            item_subtotal = qty * unit_price
            item_tax = int(item_subtotal * (tax_rate / 100.0))
            
            subtotal += item_subtotal
            total_tax += item_tax
            
            computed_items.append({
                "description": item.get("description", "Item"),
                "quantity": qty,
                "unit_price": unit_price,
                "tax_rate_percent": tax_rate,
                "tax_amount": item_tax,
                "amount": item_subtotal + item_tax
            })

        if is_interstate_tax:
            igst_amount = total_tax
            cgst_amount = 0
            sgst_amount = 0
        else:
            igst_amount = 0
            cgst_amount = total_tax // 2
            sgst_amount = total_tax - cgst_amount

        total_amount = max(0, subtotal + total_tax - discount_amount)
        invoice_number = f"INV-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"

        invoice = Invoice(
            merchant_id=merchant_id,
            customer_id=customer_id,
            invoice_number=invoice_number,
            customer_name=customer_name,
            customer_email=customer_email,
            customer_gstin=customer_gstin,
            customer_address=customer_address,
            subtotal=subtotal,
            cgst_amount=cgst_amount,
            sgst_amount=sgst_amount,
            igst_amount=igst_amount,
            tax_amount=total_tax,
            discount_amount=discount_amount,
            total_amount=total_amount,
            currency=currency,
            line_items=computed_items,
            status="ISSUED",
            notes=notes,
            terms=terms,
            due_date=due_date
        )
        db.add(invoice)
        await db.flush()
        return invoice

    @staticmethod
    def generate_invoice_pdf(invoice: Invoice, merchant_name: str, merchant_gstin: Optional[str] = None) -> bytes:
        """Generates a downloadable PDF invoice using ReportLab."""
        import io
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, leftMargin=40, rightMargin=40, topMargin=40, bottomMargin=40)
        styles = getSampleStyleSheet()

        story = []
        
        # Header
        story.append(Paragraph(f"<b>TAX INVOICE</b>", ParagraphStyle('Title', fontName='Helvetica-Bold', fontSize=18, textColor=colors.HexColor("#0f172a"))))
        story.append(Paragraph(f"Invoice Number: <b>{invoice.invoice_number}</b>", styles['Normal']))
        story.append(Paragraph(f"Date: {invoice.created_at.strftime('%d %b %Y')}", styles['Normal']))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceBefore=8, spaceAfter=12))

        # Parties Info
        parties_data = [
            [
                Paragraph(f"<b>Seller:</b><br/>{merchant_name}<br/>GSTIN: {merchant_gstin or 'N/A'}", styles['Normal']),
                Paragraph(f"<b>Bill To:</b><br/>{invoice.customer_name or 'Customer'}<br/>Email: {invoice.customer_email or 'N/A'}<br/>GSTIN: {invoice.customer_gstin or 'N/A'}", styles['Normal'])
            ]
        ]
        parties_table = Table(parties_data, colWidths=[260, 260])
        parties_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(parties_table)
        story.append(Spacer(1, 14))

        # Line Items Table
        items_header = [
            Paragraph("<b>Item Description</b>", styles['Normal']),
            Paragraph("<b>Qty</b>", styles['Normal']),
            Paragraph("<b>Unit Price</b>", styles['Normal']),
            Paragraph("<b>Tax %</b>", styles['Normal']),
            Paragraph("<b>Total (INR)</b>", styles['Normal'])
        ]
        table_rows = [items_header]

        for item in invoice.line_items:
            table_rows.append([
                Paragraph(item.get("description", "Item"), styles['Normal']),
                Paragraph(str(item.get("quantity", 1)), styles['Normal']),
                Paragraph(f"₹{item.get('unit_price', 0)/100:.2f}", styles['Normal']),
                Paragraph(f"{item.get('tax_rate_percent', 18)}%", styles['Normal']),
                Paragraph(f"₹{item.get('amount', 0)/100:.2f}", styles['Normal'])
            ])

        items_table = Table(table_rows, colWidths=[200, 40, 90, 60, 130])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(items_table)
        story.append(Spacer(1, 12))

        # Summary Breakdown Table
        summary_data = [
            [Paragraph("Subtotal:", styles['Normal']), Paragraph(f"₹{invoice.subtotal/100:.2f}", styles['Normal'])],
            [Paragraph("CGST:", styles['Normal']), Paragraph(f"₹{invoice.cgst_amount/100:.2f}", styles['Normal'])],
            [Paragraph("SGST:", styles['Normal']), Paragraph(f"₹{invoice.sgst_amount/100:.2f}", styles['Normal'])],
            [Paragraph("IGST:", styles['Normal']), Paragraph(f"₹{invoice.igst_amount/100:.2f}", styles['Normal'])],
            [Paragraph("Discount:", styles['Normal']), Paragraph(f"-₹{invoice.discount_amount/100:.2f}", styles['Normal'])],
            [Paragraph("<b>Grand Total:</b>", styles['Normal']), Paragraph(f"<b>₹{invoice.total_amount/100:.2f}</b>", styles['Normal'])]
        ]
        summary_table = Table(summary_data, colWidths=[400, 120])
        summary_table.setStyle(TableStyle([
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(summary_table)

        doc.build(story)
        return buffer.getvalue()
