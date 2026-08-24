import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.users import User, UserRole
from app.models.merchants import Merchant, MerchantMember, MerchantRole, OnboardingStatus, MerchantMode
from app.models.ledger import LedgerAccount, LedgerAccountType, Balance
from app.models.api_keys import APIKey, APIKeyType, APIKeyMode
from app.models.customers import Customer
from app.models.payments import PaymentIntent, PaymentIntentStatus, PaymentMethodType, PaymentMode
from app.core.security import hash_password, hash_api_key
from app.services.payment_service import PaymentService
from app.services.api_key_service import APIKeyService

async def seed_initial_data():
    async with AsyncSessionLocal() as session:
        # Check if admin user exists
        result = await session.execute(select(User).where(User.email == "demo@paycore.io"))
        existing_user = result.scalar_one_or_none()

        if existing_user:
            return

        print("[Seed] Seeding initial demo merchant, platform admin & PostgreSQL records...")

        # 1. Create Admin User
        admin_user = User(
            email="admin@paycore.io",
            password_hash=hash_password("admin123"),
            full_name="Platform Admin",
            role=UserRole.PLATFORM_ADMIN,
            is_email_verified=True
        )
        session.add(admin_user)

        # 2. Create Demo Merchant User
        merchant_user = User(
            email="demo@paycore.io",
            password_hash=hash_password("password123"),
            full_name="Acme Inc",
            phone_number="+91 98765 43210",
            role=UserRole.MERCHANT_ADMIN,
            is_email_verified=True
        )
        session.add(merchant_user)
        await session.flush()

        # 3. Create Merchant Profile
        merchant = Merchant(
            business_name="Acme Global Payments",
            support_email="demo@paycore.io",
            gstin="22AAAAA0000A1Z5",
            onboarding_status=OnboardingStatus.VERIFIED,
            onboarding_step=6,
            environment_mode=MerchantMode.TEST
        )
        session.add(merchant)
        await session.flush()

        # 4. Link User to Merchant
        member = MerchantMember(
            merchant_id=merchant.id,
            user_id=merchant_user.id,
            role=MerchantRole.OWNER
        )
        session.add(member)

        # 5. Create Double-Entry Ledger Accounts
        clearing_acc = LedgerAccount(
            merchant_id=merchant.id,
            account_type=LedgerAccountType.CUSTOMER_CLEARING,
            currency="INR",
            name="Customer Clearing (Acme Global)"
        )
        payable_acc = LedgerAccount(
            merchant_id=merchant.id,
            account_type=LedgerAccountType.MERCHANT_PAYABLE,
            currency="INR",
            name="Merchant Payable (Acme Global)"
        )
        revenue_acc = LedgerAccount(
            merchant_id=None,
            account_type=LedgerAccountType.PLATFORM_REVENUE,
            currency="INR",
            name="PAYCORE Platform Revenue"
        )
        session.add_all([clearing_acc, payable_acc, revenue_acc])

        # 6. Create Initial Balance
        balance = Balance(
            merchant_id=merchant.id,
            currency="INR",
            available_amount=146902,  # ₹1,469.02
            pending_amount=0,
            reserved_amount=0
        )
        session.add(balance)

        # 7. Create Demo API Keys
        await APIKeyService.create_key(session, merchant_id=merchant.id, name="Default Backend Secret Key", key_type=APIKeyType.SECRET, mode=APIKeyMode.TEST)
        await APIKeyService.create_key(session, merchant_id=merchant.id, name="Default Frontend Publishable Key", key_type=APIKeyType.PUBLISHABLE, mode=APIKeyMode.TEST)

        # 8. Create Demo Customer
        customer = Customer(
            merchant_id=merchant.id,
            email="jane.doe@example.com",
            name="Jane Doe",
            phone="+919876543210"
        )
        session.add(customer)
        await session.flush()

        # 9. Create Demo Payments
        intent1 = await PaymentService.create_payment_intent(
            session,
            merchant_id=merchant.id,
            customer_id=customer.id,
            amount=149900,  # ₹1,499.00
            currency="INR",
            description="Pro Plan Annual Subscription",
            mode=PaymentMode.TEST
        )
        await PaymentService.confirm_payment_intent(
            session,
            payment_intent_id=intent1.id,
            payment_method_type=PaymentMethodType.CARD,
            payment_details={"card_number": "4242 4242 4242 4242", "exp_month": "12", "exp_year": "2030", "cvv": "123"}
        )

        intent2 = await PaymentService.create_payment_intent(
            session,
            merchant_id=merchant.id,
            customer_id=customer.id,
            amount=499900,  # ₹4,999.00
            currency="INR",
            description="Enterprise SDK License",
            mode=PaymentMode.TEST
        )
        await PaymentService.confirm_payment_intent(
            session,
            payment_intent_id=intent2.id,
            payment_method_type=PaymentMethodType.CARD,
            payment_details={"card_number": "4242 4242 4242 4242", "exp_month": "12", "exp_year": "2030", "cvv": "123"}
        )

        await session.commit()
        print("[Seed] Initial data seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_initial_data())
