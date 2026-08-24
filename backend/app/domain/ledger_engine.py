from typing import List, Tuple, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.ledger import (
    LedgerAccount, LedgerTransaction, LedgerEntry, Balance,
    LedgerAccountType, EntryType
)
from app.models.merchants import Merchant

class LedgerImbalanceError(Exception):
    def __init__(self, total_debits: int, total_credits: int):
        super().__init__(f"Ledger entries imbalance! Total Debits: {total_debits}, Total Credits: {total_credits}")

class LedgerEngine:
    """
    Double-Entry Ledger Engine:
    Guarantees that every financial movement (Payment, Refund, Platform Fee)
    creates balanced Debit and Credit entries across immutable accounts.
    """

    @classmethod
    async def get_or_create_account(
        cls, session: AsyncSession, merchant_id: Optional[str], account_type: LedgerAccountType, currency: str = "INR"
    ) -> LedgerAccount:
        query = select(LedgerAccount).where(
            LedgerAccount.account_type == account_type,
            LedgerAccount.currency == currency
        )
        if merchant_id:
            query = query.where(LedgerAccount.merchant_id == merchant_id)
        else:
            query = query.where(LedgerAccount.merchant_id.is_(None))

        result = await session.execute(query)
        account = result.scalar_one_or_none()

        if not account:
            account_name = f"{account_type.value} ({merchant_id or 'PLATFORM'})"
            account = LedgerAccount(
                merchant_id=merchant_id,
                account_type=account_type,
                currency=currency,
                name=account_name
            )
            session.add(account)
            await session.flush()

        return account

    @classmethod
    async def record_payment_capture(
        cls,
        session: AsyncSession,
        merchant_id: str,
        payment_intent_id: str,
        amount: int,
        fee_amount: int,
        currency: str = "INR"
    ) -> LedgerTransaction:
        """
        Record a successful payment:
        Debit: Customer Clearing (amount)
        Credit: Merchant Payable (amount - fee)
        Credit: Platform Revenue (fee)
        """
        net_merchant_amount = amount - fee_amount

        clearing_acc = await cls.get_or_create_account(session, merchant_id, LedgerAccountType.CUSTOMER_CLEARING, currency)
        payable_acc = await cls.get_or_create_account(session, merchant_id, LedgerAccountType.MERCHANT_PAYABLE, currency)
        revenue_acc = await cls.get_or_create_account(session, None, LedgerAccountType.PLATFORM_REVENUE, currency)

        ltx = LedgerTransaction(
            reference_type="PAYMENT",
            reference_id=payment_intent_id,
            description=f"Payment capture for {payment_intent_id}"
        )
        session.add(ltx)
        await session.flush()

        entries = [
            LedgerEntry(
                ledger_transaction_id=ltx.id,
                ledger_account_id=clearing_acc.id,
                entry_type=EntryType.DEBIT,
                amount=amount
            ),
            LedgerEntry(
                ledger_transaction_id=ltx.id,
                ledger_account_id=payable_acc.id,
                entry_type=EntryType.CREDIT,
                amount=net_merchant_amount
            ),
            LedgerEntry(
                ledger_transaction_id=ltx.id,
                ledger_account_id=revenue_acc.id,
                entry_type=EntryType.CREDIT,
                amount=fee_amount
            )
        ]

        cls._verify_and_add_entries(session, entries)
        await cls._update_merchant_balance(session, merchant_id, net_merchant_amount, 0, currency)
        return ltx

    @classmethod
    async def record_refund(
        cls,
        session: AsyncSession,
        merchant_id: str,
        refund_id: str,
        amount: int,
        currency: str = "INR"
    ) -> LedgerTransaction:
        """
        Record a payment refund:
        Debit: Merchant Payable (amount)
        Credit: Customer Clearing (amount)
        """
        payable_acc = await cls.get_or_create_account(session, merchant_id, LedgerAccountType.MERCHANT_PAYABLE, currency)
        clearing_acc = await cls.get_or_create_account(session, merchant_id, LedgerAccountType.CUSTOMER_CLEARING, currency)

        ltx = LedgerTransaction(
            reference_type="REFUND",
            reference_id=refund_id,
            description=f"Refund processed for {refund_id}"
        )
        session.add(ltx)
        await session.flush()

        entries = [
            LedgerEntry(
                ledger_transaction_id=ltx.id,
                ledger_account_id=payable_acc.id,
                entry_type=EntryType.DEBIT,
                amount=amount
            ),
            LedgerEntry(
                ledger_transaction_id=ltx.id,
                ledger_account_id=clearing_acc.id,
                entry_type=EntryType.CREDIT,
                amount=amount
            )
        ]

        cls._verify_and_add_entries(session, entries)
        await cls._update_merchant_balance(session, merchant_id, -amount, 0, currency)
        return ltx

    @classmethod
    def _verify_and_add_entries(cls, session: AsyncSession, entries: List[LedgerEntry]):
        total_debits = sum(e.amount for e in entries if e.entry_type == EntryType.DEBIT)
        total_credits = sum(e.amount for e in entries if e.entry_type == EntryType.CREDIT)

        if total_debits != total_credits:
            raise LedgerImbalanceError(total_debits, total_credits)

        for entry in entries:
            session.add(entry)

    @classmethod
    async def _update_merchant_balance(
        cls, session: AsyncSession, merchant_id: str, available_delta: int, pending_delta: int, currency: str = "INR"
    ):
        result = await session.execute(select(Balance).where(Balance.merchant_id == merchant_id, Balance.currency == currency))
        bal = result.scalar_one_or_none()

        if not bal:
            bal = Balance(
                merchant_id=merchant_id,
                currency=currency,
                available_amount=available_delta,
                pending_amount=pending_delta,
                reserved_amount=0
            )
            session.add(bal)
        else:
            bal.available_amount += available_delta
            bal.pending_amount += pending_delta
