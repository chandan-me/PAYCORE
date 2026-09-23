import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.users import User, UserRole
from app.models.merchants import Merchant, MerchantMember, MerchantRole, OnboardingStatus
from app.models.ledger import LedgerAccount, LedgerAccountType, Balance
from app.models.settlements_payouts import PayoutStatus
from app.services.settlement_service import SettlementService
from app.services.payout_service import PayoutService
from app.core.security import hash_password

@pytest.mark.asyncio
async def test_settlement_and_payout_flow(test_db: AsyncSession):
    session = test_db

    # 1. Setup Merchant with Pending Balance
    user = User(email="payout_mch@example.com", password_hash=hash_password("pass"), full_name="Payout Tester", role=UserRole.MERCHANT_ADMIN)
    session.add(user)
    await session.flush()

    mch = Merchant(business_name="Settlement Store", support_email="payout_mch@example.com", onboarding_status=OnboardingStatus.VERIFIED)
    session.add(mch)
    await session.flush()

    clearing = LedgerAccount(merchant_id=mch.id, account_type=LedgerAccountType.CUSTOMER_CLEARING, currency="INR", name="Clearing")
    payable = LedgerAccount(merchant_id=mch.id, account_type=LedgerAccountType.MERCHANT_PAYABLE, currency="INR", name="Payable")
    balance = Balance(merchant_id=mch.id, currency="INR", available_amount=0, pending_amount=100000, reserved_amount=0)
    session.add_all([clearing, payable, balance])
    await session.flush()

    # 2. Run Settlement Batch (T+1)
    batch = await SettlementService.process_settlement_batch(session, settlement_cycle="T+1")
    assert batch.total_amount == 100000
    assert batch.total_merchants == 1

    # Verify balance moved from PENDING -> AVAILABLE
    await session.refresh(balance)
    assert balance.pending_amount == 0
    assert balance.available_amount == 100000  # ₹1,000.00 available

    # 3. Request Payout
    payout = await PayoutService.create_payout(
        session,
        merchant_id=mch.id,
        amount=60000,  # ₹600.00
        payout_method="IMPS",
        bank_account_number="1234567890",
        bank_ifsc="HDFC0001234",
        account_holder_name="Settlement Store"
    )
    assert payout.status == PayoutStatus.SUCCEEDED
    assert payout.amount == 60000

    # Verify updated available balance (100000 - 60000 = 40000)
    await session.refresh(balance)
    assert balance.available_amount == 40000
