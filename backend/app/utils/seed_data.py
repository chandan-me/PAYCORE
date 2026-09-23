import asyncio
import uuid
from datetime import datetime, timezone
from app.database import AsyncSessionLocal
from app.models import (
    User, PlatformAdmin, Merchant, MerchantMember, OnboardingStatus, MerchantRole, Balance, APIKey, APIKeyType, APIKeyMode, Customer,
    PaymentLink, PaymentLinkStatus, SubscriptionPlan, LedgerAccount, LedgerAccountType, UserRole
)
from app.core.security import hash_password, hash_api_key

async def seed():
    print("[*] Seeding initial test data into MySQL database...")
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        from sqlalchemy import select
        res = await db.execute(select(PlatformAdmin).filter_by(email="admin@paycore.dev"))
        if not res.scalars().first():
            # 1. Create Platform Admin in platform_admins table
            platform_admin = PlatformAdmin(
                id=f"adm_{uuid.uuid4().hex[:8]}",
                email="admin@paycore.dev",
                password_hash=hash_password("Admin@12345"),
                full_name="Platform Super Admin",
                is_super_admin=True,
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(platform_admin)

        user_res = await db.execute(select(User).filter_by(email="admin@paycore.dev"))
        if not user_res.scalars().first():
            admin_user = User(
                id=f"usr_admin_{uuid.uuid4().hex[:8]}",
                email="admin@paycore.dev",
                password_hash=hash_password("Admin@12345"),
                full_name="Platform Admin",
                role=UserRole.PLATFORM_ADMIN,
                is_active=True,
                is_email_verified=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(admin_user)

        # 2. Create Merchant & Merchant User
        mch_res = await db.execute(select(User).filter_by(email="merchant@paycore.dev"))
        if not mch_res.scalars().first():
            mch_id = f"mch_{uuid.uuid4().hex[:12]}"
            merchant = Merchant(
                id=mch_id,
                business_name="Acme Global Technologies",
                legal_name="Acme Global Technologies Pvt Ltd",
                support_email="support@acmeglobal.com",
                gstin="29ABCDE1234F1Z5",
                onboarding_status=OnboardingStatus.VERIFIED,
                onboarding_step=5,
                created_at=datetime.now(timezone.utc)
            )
            db.add(merchant)
            await db.flush()

            merchant_user = User(
                id=f"usr_mch_{uuid.uuid4().hex[:8]}",
                email="merchant@paycore.dev",
                password_hash=hash_password("Merchant@12345"),
                full_name="Chandan Kumar",
                role=UserRole.MERCHANT_ADMIN,
                is_active=True,
                is_email_verified=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(merchant_user)
            await db.flush()

            # Link Merchant Membership
            membership = MerchantMember(
                id=f"mcm_{uuid.uuid4().hex[:8]}",
                merchant_id=mch_id,
                user_id=merchant_user.id,
                role=MerchantRole.ADMIN,
                created_at=datetime.now(timezone.utc)
            )
            db.add(membership)

            # 3. Create Merchant Balances
            balance = Balance(
                id=f"bal_{uuid.uuid4().hex[:8]}",
                merchant_id=mch_id,
                currency="INR",
                available_amount=1499000,   # INR 14,990.00
                pending_amount=250000,     # INR 2,500.00
                reserved_amount=0,
                updated_at=datetime.now(timezone.utc)
            )
            db.add(balance)

            # 4. Create API Keys (Test & Live)
            prefix_test = "sk_test_demo"
            hash_test_sec = hash_api_key("sk_test_demo_key_987654321")
            key_test = APIKey(
                id=f"key_{uuid.uuid4().hex[:8]}",
                merchant_id=mch_id,
                name="Default Test Key",
                key_type=APIKeyType.SECRET,
                mode=APIKeyMode.TEST,
                key_prefix=prefix_test,
                key_hash=hash_test_sec,
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(key_test)

            # 5. Create Sample Customer
            cust_id = f"cust_{uuid.uuid4().hex[:8]}"
            customer = Customer(
                id=cust_id,
                merchant_id=mch_id,
                email="alex.smith@example.com",
                name="Alex Smith",
                phone="+919876543210",
                created_at=datetime.now(timezone.utc)
            )
            db.add(customer)
            await db.flush()

            # 6. Create Sample Subscription Plan
            plan = SubscriptionPlan(
                id=f"plan_{uuid.uuid4().hex[:8]}",
                merchant_id=mch_id,
                name="Pro Growth Monthly Tier",
                description="Unlimited API calls and real-time fraud monitoring",
                amount=299900,  # INR 2,999.00
                currency="INR",
                billing_interval="MONTHLY",
                interval_count=1,
                trial_period_days=14,
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(plan)

            # 7. Create Sample Payment Link
            slug = f"plnk_{uuid.uuid4().hex[:8]}"
            link = PaymentLink(
                id=f"link_{uuid.uuid4().hex[:8]}",
                merchant_id=mch_id,
                customer_id=cust_id,
                title="Q3 Enterprise SaaS Subscription",
                description="Direct invoice payment link",
                amount=499900,
                currency="INR",
                slug=slug,
                short_url=f"http://localhost:5173/checkout/{slug}",
                status=PaymentLinkStatus.ACTIVE,
                created_at=datetime.now(timezone.utc)
            )
            db.add(link)

            # 8. Create Sample Ledger Accounts
            acc_clr = LedgerAccount(id=f"lac_clr_{uuid.uuid4().hex[:6]}", merchant_id=mch_id, name="Customer Clearing", account_type=LedgerAccountType.CUSTOMER_CLEARING, currency="INR")
            acc_pay = LedgerAccount(id=f"lac_pay_{uuid.uuid4().hex[:6]}", merchant_id=mch_id, name="Merchant Payable", account_type=LedgerAccountType.MERCHANT_PAYABLE, currency="INR")
            acc_rev = LedgerAccount(id=f"lac_rev_{uuid.uuid4().hex[:6]}", merchant_id=mch_id, name="Platform Revenue", account_type=LedgerAccountType.PLATFORM_REVENUE, currency="INR")
            db.add_all([acc_clr, acc_pay, acc_rev])

        await db.commit()
        print("\n[+] Seed data created successfully in MySQL!")
        print("==================================================")
        print("PLATFORM ADMIN LOGIN:")
        print("  Email:    admin@paycore.dev")
        print("  Password: Admin@12345")
        print("\nMERCHANT LOGIN:")
        print("  Email:    merchant@paycore.dev")
        print("  Password: Merchant@12345")
        print("==================================================")

if __name__ == "__main__":
    asyncio.run(seed())
