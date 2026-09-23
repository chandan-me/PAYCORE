from datetime import datetime, timezone
from typing import Optional, List
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.ledger import Balance, LedgerAccount, LedgerTransaction, LedgerEntry, LedgerAccountType, EntryType
from app.models.settlements_payouts import Payout, PayoutStatus, PayoutMethod
from app.models.invoices_notifications import AuditLog

class PayoutService:
    @staticmethod
    async def create_payout(
        db: AsyncSession,
        merchant_id: str,
        amount: int,
        payout_method: str,
        bank_account_number: str,
        bank_ifsc: str,
        account_holder_name: str,
        idempotency_key: Optional[str] = None,
        metadata_json: Optional[dict] = None
    ) -> Payout:
        """Executes a merchant payout request with strict balance checks and ledger debit."""
        if idempotency_key:
            existing = await db.execute(
                select(Payout).where(Payout.merchant_id == merchant_id, Payout.idempotency_key == idempotency_key)
            )
            found = existing.scalar_one_or_none()
            if found:
                return found

        # Calculate Fee: e.g. Instant payout = 1% or minimum 500 paise, Standard = 0
        fee_amount = 0
        if payout_method.upper() == "INSTANT":
            fee_amount = max(500, int(amount * 0.01))
            
        total_deduction = amount + fee_amount

        # Lock merchant balance for update
        bal_res = await db.execute(
            select(Balance).where(Balance.merchant_id == merchant_id).with_for_update()
        )
        balance = bal_res.scalar_one_or_none()
        if not balance:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Merchant balance not found.")

        if balance.available_amount < total_deduction:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient available balance. Available: INR {balance.available_amount/100:.2f}, Required: INR {total_deduction/100:.2f}"
            )

        # Deduct balance immediately
        balance.available_amount -= total_deduction

        # Create Payout record
        method_enum = PayoutMethod[payout_method.upper()] if payout_method.upper() in PayoutMethod.__members__ else PayoutMethod.IMPS
        utr = f"UTR{datetime.now().strftime('%Y%m%d%H%M%S')}{merchant_id[:4].upper()}"
        
        payout = Payout(
            merchant_id=merchant_id,
            amount=amount,
            fee_amount=fee_amount,
            currency=balance.currency,
            payout_method=method_enum,
            status=PayoutStatus.SUCCEEDED,  # Simulated immediate success in sandbox/test
            bank_account_number=bank_account_number,
            bank_ifsc=bank_ifsc,
            account_holder_name=account_holder_name,
            utr=utr,
            provider_reference=f"bank_ref_{utr}",
            idempotency_key=idempotency_key,
            metadata_json=metadata_json
        )
        db.add(payout)
        await db.flush()

        # Create Ledger Journal Entries: Debit Merchant Payable, Credit Customer Clearing
        payable_acc_res = await db.execute(
            select(LedgerAccount).where(
                LedgerAccount.merchant_id == merchant_id,
                LedgerAccount.account_type == LedgerAccountType.MERCHANT_PAYABLE
            )
        )
        payable_acc = payable_acc_res.scalar_one_or_none()
        
        if payable_acc:
            ledger_tx = LedgerTransaction(
                reference_type="PAYOUT",
                reference_id=payout.id,
                description=f"Bank Payout ({payout_method}): {utr}"
            )
            db.add(ledger_tx)
            await db.flush()

            # Entry 1: Debit Merchant Payable for amount
            entry1 = LedgerEntry(
                ledger_transaction_id=ledger_tx.id,
                ledger_account_id=payable_acc.id,
                entry_type=EntryType.DEBIT,
                amount=amount
            )
            db.add(entry1)

            # Entry 2: Credit Customer Clearing / Payout clearing account
            clearing_acc_res = await db.execute(
                select(LedgerAccount).where(
                    LedgerAccount.merchant_id == merchant_id,
                    LedgerAccount.account_type == LedgerAccountType.CUSTOMER_CLEARING
                )
            )
            clearing_acc = clearing_acc_res.scalar_one_or_none()
            if clearing_acc:
                entry2 = LedgerEntry(
                    ledger_transaction_id=ledger_tx.id,
                    ledger_account_id=clearing_acc.id,
                    entry_type=EntryType.CREDIT,
                    amount=amount
                )
                db.add(entry2)

        audit = AuditLog(
            actor_id=merchant_id,
            actor_type="MERCHANT",
            action="PAYOUT_PROCESSED",
            resource_type="Payout",
            resource_id=payout.id,
            metadata_json={"amount": amount, "fee": fee_amount, "method": payout_method, "utr": utr}
        )
        db.add(audit)
        await db.flush()
        return payout

    @staticmethod
    async def list_payouts(db: AsyncSession, merchant_id: str) -> List[Payout]:
        result = await db.execute(
            select(Payout).where(Payout.merchant_id == merchant_id).order_by(Payout.created_at.desc())
        )
        return result.scalars().all()
