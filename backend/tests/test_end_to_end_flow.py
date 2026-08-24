import pytest
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.users import User, UserRole
from app.models.merchants import Merchant, MerchantMember, MerchantRole, OnboardingStatus, MerchantMode
from app.models.payments import PaymentIntent, PaymentIntentStatus, PaymentMethodType
from app.models.transactions import Transaction, TransactionType, TransactionStatus
from app.models.ledger import LedgerAccount, LedgerAccountType, Balance
from app.domain.payment_state_machine import PaymentStateMachine
from app.domain.ledger_engine import LedgerEngine
from app.services.payment_service import PaymentService
from app.services.refund_service import RefundService
from app.core.security import hash_password

@pytest.mark.asyncio
async def test_full_payment_and_refund_lifecycle(test_db: AsyncSession):
    session = test_db

    # 1. Setup Merchant
    user = User(email="testmch@example.com", password_hash=hash_password("pass"), full_name="Tester", role=UserRole.MERCHANT_ADMIN)
    session.add(user)
    await session.flush()

    mch = Merchant(business_name="Test Store", support_email="testmch@example.com", onboarding_status=OnboardingStatus.VERIFIED)
    session.add(mch)
    await session.flush()

    member = MerchantMember(merchant_id=mch.id, user_id=user.id, role=MerchantRole.OWNER)
    session.add(member)

    # 2. Setup Ledger Accounts & Balance
    clearing_acc = LedgerAccount(merchant_id=mch.id, account_type=LedgerAccountType.CUSTOMER_CLEARING, currency="INR", name="Customer Clearing")
    payable_acc = LedgerAccount(merchant_id=mch.id, account_type=LedgerAccountType.MERCHANT_PAYABLE, currency="INR", name="Merchant Payable")
    balance = Balance(merchant_id=mch.id, currency="INR", available_amount=0, pending_amount=0, reserved_amount=0)
    session.add_all([clearing_acc, payable_acc, balance])
    await session.flush()

    # 3. Create & Confirm Payment Intent
    intent = await PaymentService.create_payment_intent(
        session,
        merchant_id=mch.id,
        amount=100000,  # ₹1,000.00
        currency="INR",
        description="Test Order"
    )
    assert intent.status == PaymentIntentStatus.REQUIRES_PAYMENT_METHOD

    # Confirm Payment
    confirmed = await PaymentService.confirm_payment_intent(
        session,
        payment_intent_id=intent.id,
        payment_method_type=PaymentMethodType.CARD,
        payment_details={"card_number": "4242 4242 4242 4242", "exp_month": "12", "exp_year": "2030", "cvv": "123"}
    )
    assert confirmed.status == PaymentIntentStatus.SUCCEEDED
    assert confirmed.captured_amount == 100000

    # Verify Ledger Balance
    bal_res = await session.execute(select(Balance).where(Balance.merchant_id == mch.id))
    bal = bal_res.scalar_one()
    # 2% fee = ₹20.00 (2000 paise). Net = 98000 paise
    assert bal.available_amount == 98000

    # 4. Process Refund
    refund = await RefundService.create_refund(
        session,
        merchant_id=mch.id,
        payment_intent_id=confirmed.id,
        amount=50000,  # ₹500.00 partial refund
        reason="Customer returned half items"
    )
    assert refund.status.value == "SUCCEEDED"

    # Verify Updated Intent & Balance
    await session.refresh(confirmed)
    assert confirmed.status == PaymentIntentStatus.PARTIALLY_REFUNDED
    assert confirmed.refunded_amount == 50000

    await session.refresh(bal)
    assert bal.available_amount == 48000  # 98000 - 50000
