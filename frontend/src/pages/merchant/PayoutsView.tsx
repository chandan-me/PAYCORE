import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  ArrowUpRight,
  Wallet,
  Clock,
  AlertCircle,
  Plus,
  Zap
} from 'lucide-react';
import { MoneyFormat } from '../../components/MoneyFormat';
import { StatusBadge } from '../../components/StatusBadge';

interface Payout {
  id: string;
  amount: number;
  fee_amount: number;
  currency: string;
  payout_method: string;
  status: string;
  bank_account_number: string;
  bank_ifsc: string;
  account_holder_name: string;
  utr?: string;
  created_at: string;
}

const payoutValidationSchema = Yup.object({
  amount: Yup.number()
    .typeError('Amount must be a valid number')
    .positive('Amount must be greater than 0')
    .min(10, 'Minimum payout amount is ₹10.00')
    .required('Payout amount is required'),
  method: Yup.string()
    .oneOf(['IMPS', 'NEFT', 'RTGS', 'INSTANT'], 'Invalid payout method')
    .required('Payout method is required'),
  holderName: Yup.string()
    .trim()
    .required('Account holder name is required')
    .min(2, 'Name must be at least 2 characters'),
  bankAccount: Yup.string()
    .trim()
    .required('Bank account number is required')
    .matches(/^[0-9]{9,18}$/, 'Account number must be 9 to 18 digits'),
  ifsc: Yup.string()
    .trim()
    .required('IFSC code is required')
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC format (e.g. HDFC0001234)')
});

export const PayoutsView: React.FC = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const pendingBalance = 0;
  const [loading, setLoading] = useState(true);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('paycore_token');
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch Balances
      const mchRes = await fetch('http://localhost:8000/v1/merchants/me', { headers });
      if (mchRes.ok) {
        const mchData = await mchRes.json();
        // Calculate or get balance
        setAvailableBalance(mchData.available_balance || 146902);
      }

      // 2. Fetch Payouts
      const poRes = await fetch('http://localhost:8000/v1/payouts', { headers });
      if (poRes.ok) {
        const poData = await poRes.json();
        setPayouts(poData);
      }
    } catch (err) {
      console.error('Failed to load payout data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formik = useFormik({
    initialValues: {
      amount: '',
      method: 'IMPS' as 'IMPS' | 'NEFT' | 'RTGS' | 'INSTANT',
      bankAccount: '987654321098',
      ifsc: 'HDFC0001234',
      holderName: 'Acme Global Payments'
    },
    validationSchema: payoutValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      setPayoutError(null);
      try {
        setSubmitting(true);
        const token = localStorage.getItem('paycore_token');
        const minorAmount = Math.round(parseFloat(values.amount as string) * 100);

        const res = await fetch('http://localhost:8000/v1/payouts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: minorAmount,
            currency: 'INR',
            payout_method: values.method,
            bank_account_number: values.bankAccount.trim(),
            bank_ifsc: values.ifsc.trim().toUpperCase(),
            account_holder_name: values.holderName.trim()
          })
        });

        if (res.ok) {
          setIsPayoutModalOpen(false);
          resetForm();
          fetchData();
        } else {
          const err = await res.json();
          setPayoutError(err.detail || 'Payout failed.');
        }
      } catch (err: any) {
        setPayoutError(err.message || 'Connection error.');
      } finally {
        setSubmitting(false);
      }
    }
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ArrowUpRight className="w-6 h-6 text-emerald-400" />
            Payouts & Bank Settlements
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated T+1/T+2 settlement reconciliation, Instant Payouts, and IMPS/NEFT disbursements.
          </p>
        </div>

        <button
          onClick={() => setIsPayoutModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/30 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Request Payout
        </button>
      </div>

      {/* Balance KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
            <span>Available for Payout</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            <MoneyFormat amount={availableBalance} currency="INR" />
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">Real-time ledger payable balance</div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
            <span>Pending T+1 Settlement</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            <MoneyFormat amount={pendingBalance} currency="INR" />
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">Automated daily bank settlement queue</div>
        </div>
      </div>

      {/* Payouts History Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Payouts & Disbursements</span>
          <span className="text-xs text-slate-500 font-mono">{payouts.length} Transactions</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm font-mono">Loading payouts...</div>
        ) : payouts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No payout requests executed yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Payout ID</th>
                  <th className="px-6 py-3.5">Bank Details</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">UTR Reference</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {payouts.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-indigo-400 font-medium">{po.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{po.account_holder_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">A/C: {po.bank_account_number} • {po.bank_ifsc}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-300">{po.payout_method}</td>
                    <td className="px-6 py-4 font-bold text-white">
                      <MoneyFormat amount={po.amount} currency={po.currency} />
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-400">{po.utr || 'Pending UTR'}</td>
                    <td className="px-6 py-4 text-slate-400 font-mono">{new Date(po.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <StatusBadge status={po.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout Request Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-emerald-400" />
              Initiate Bank Payout
            </h2>

            {payoutError && (
              <div className="mt-3 p-3 bg-red-950/50 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {payoutError}
              </div>
            )}

            <form onSubmit={formik.handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Transfer Method</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['IMPS', 'NEFT', 'RTGS', 'INSTANT'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => formik.setFieldValue('method', m)}
                      className={`py-2 text-center rounded-lg font-bold transition-all cursor-pointer ${
                        formik.values.method === m
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {m === 'INSTANT' ? <span className="flex items-center justify-center gap-1"><Zap className="w-3 h-3" />⚡</span> : m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Payout Amount (INR) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={formik.values.amount}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g. 1000.00"
                  className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 ${
                    formik.touched.amount && formik.errors.amount
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-800 focus:ring-emerald-500'
                  }`}
                />
                {formik.touched.amount && formik.errors.amount && (
                  <p className="mt-1 text-[11px] text-rose-400">{formik.errors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Account Holder Name *</label>
                <input
                  type="text"
                  name="holderName"
                  value={formik.values.holderName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 ${
                    formik.touched.holderName && formik.errors.holderName
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-800 focus:ring-emerald-500'
                  }`}
                />
                {formik.touched.holderName && formik.errors.holderName && (
                  <p className="mt-1 text-[11px] text-rose-400">{formik.errors.holderName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Bank Account Number *</label>
                  <input
                    type="text"
                    name="bankAccount"
                    value={formik.values.bankAccount}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 ${
                      formik.touched.bankAccount && formik.errors.bankAccount
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-slate-800 focus:ring-emerald-500'
                    }`}
                  />
                  {formik.touched.bankAccount && formik.errors.bankAccount && (
                    <p className="mt-1 text-[11px] text-rose-400">{formik.errors.bankAccount}</p>
                  )}
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">IFSC Code *</label>
                  <input
                    type="text"
                    name="ifsc"
                    value={formik.values.ifsc}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 uppercase ${
                      formik.touched.ifsc && formik.errors.ifsc
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-slate-800 focus:ring-emerald-500'
                    }`}
                  />
                  {formik.touched.ifsc && formik.errors.ifsc && (
                    <p className="mt-1 text-[11px] text-rose-400">{formik.errors.ifsc}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  {submitting ? 'Processing Payout...' : 'Transfer to Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
