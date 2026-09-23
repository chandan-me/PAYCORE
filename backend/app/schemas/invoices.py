from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class InvoiceLineItem(BaseModel):
    description: str = Field(..., min_length=1, max_length=255)
    quantity: int = Field(default=1, ge=1)
    unit_price: int = Field(..., ge=0, description="Unit price in minor units (paise)")
    tax_rate_percent: float = Field(default=18.0, ge=0, le=100)  # e.g., 18% GST
    amount: Optional[int] = None

class InvoiceCreate(BaseModel):
    customer_id: Optional[str] = None
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_email: Optional[str] = None
    customer_gstin: Optional[str] = None
    customer_address: Optional[str] = None
    
    currency: str = Field(default="INR", min_length=3, max_length=3)
    is_interstate_tax: bool = Field(default=False, description="True for IGST, False for CGST + SGST")
    discount_amount: int = Field(default=0, ge=0)
    
    line_items: List[InvoiceLineItem] = Field(..., min_items=1)
    notes: Optional[str] = None
    terms: Optional[str] = None
    due_date: Optional[datetime] = None

class InvoiceResponse(BaseModel):
    id: str
    merchant_id: str
    customer_id: Optional[str] = None
    payment_intent_id: Optional[str] = None
    invoice_number: str
    order_id: Optional[str] = None
    
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_gstin: Optional[str] = None
    customer_address: Optional[str] = None
    
    subtotal: int
    cgst_amount: int
    sgst_amount: int
    igst_amount: int
    tax_amount: int
    discount_amount: int
    total_amount: int
    currency: str
    
    line_items: List[Dict[str, Any]]
    status: str
    notes: Optional[str] = None
    terms: Optional[str] = None
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    pdf_url: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
