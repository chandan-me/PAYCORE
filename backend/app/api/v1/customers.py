from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.auth_deps import get_current_merchant
from app.models.merchants import Merchant
from app.models.customers import Customer
from app.schemas.customers import CustomerCreate, CustomerResponse

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    data: CustomerCreate,
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    customer = Customer(
        merchant_id=merchant.id,
        external_id=data.external_id,
        email=data.email,
        name=data.name,
        phone=data.phone,
        description=data.description,
        metadata_json=data.metadata_json
    )
    db.add(customer)
    await db.flush()
    return customer

@router.get("", response_model=List[CustomerResponse])
async def list_customers(
    merchant: Merchant = Depends(get_current_merchant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Customer).where(Customer.merchant_id == merchant.id).order_by(Customer.created_at.desc())
    )
    return result.scalars().all()
