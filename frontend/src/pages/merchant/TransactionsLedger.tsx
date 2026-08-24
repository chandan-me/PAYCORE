import React, { useState, useEffect } from 'react';
import { Scale } from 'lucide-react';
import api from '../../services/api';
import { MoneyFormat } from '../../components/MoneyFormat';

export const TransactionsLedger: React.FC = () => {
  const [balances, setBalances] = useState<any>(null);

  useEffect(() => {
    const fetchBal = async () => {
      try {
        const resp = await api.get('/merchants/balances');
        setBalances(resp.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBal();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Transactions & Double-Entry Ledger</h1>
        <p className="text-xs text-slate-400 mt-0.5">Immutable accounting journal entries ensuring zero floating-point discrepancies</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border-indigo-500/30">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-1">Available Balance</span>
          <MoneyFormat amount={balances?.available_amount || 0} className="text-2xl font-black text-white" />
          <p className="text-[11px] text-slate-400 mt-2">Cleared & ready for payout</p>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">Pending Balance</span>
          <MoneyFormat amount={balances?.pending_amount || 0} className="text-2xl font-black text-white" />
          <p className="text-[11px] text-slate-400 mt-2">In provider settlement pipeline</p>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider block mb-1">Reserved Balance</span>
          <MoneyFormat amount={balances?.reserved_amount || 0} className="text-2xl font-black text-white" />
          <p className="text-[11px] text-slate-400 mt-2">Held for chargeback risk protection</p>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 to-indigo-950/20 space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold">
          <Scale className="w-4 h-4" />
          <span>Double-Entry Accounting System</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          PAYCORE maintains immutable double-entry ledger journals. For every customer payment capture:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="font-bold text-emerald-400 block mb-1">Debit: Customer Clearing</span>
            <span className="text-slate-400">Receives gross payment amount from customer card/UPI.</span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="font-bold text-indigo-400 block mb-1">Credit: Merchant Payable</span>
            <span className="text-slate-400">Net merchant earnings credited to your available balance.</span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="font-bold text-purple-400 block mb-1">Credit: Platform Revenue</span>
            <span className="text-slate-400">2.0% platform fee credited to PAYCORE revenue.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
