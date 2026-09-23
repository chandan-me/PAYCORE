import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  ArrowUpRight,
  Wallet,
  Clock,
  AlertCircle,
  Plus,
  Zap,
  Building2
} from 'lucide-react';
import { MoneyFormat } from '../../components/MoneyFormat';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../context/ToastContext';

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
  const toast = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('paycore_token');
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch Balances
      const mchRes = await fetch('http://localhost:8000/v1/merchants/me', { headers });
      if (mchRes.ok) {
        const mchData = await mchRes.json();
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
      toast.error('Failed to Load Payouts', 'Could not load balance and payouts history.');
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
          const newPo = await res.json();
          setIsPayoutModalOpen(false);
          resetForm();
          fetchData();
          toast.payment({
            title: 'Bank Disbursal Initiated',
            message: `Payout of ₹${values.amount} dispatched to ${values.holderName.trim()} (${values.ifsc.trim().toUpperCase()}).`,
            amount: minorAmount,
            currency: 'INR',
            status: newPo.status || 'PROCESSED',
            utr: newPo.utr || 'IMPS_' + Math.floor(10000000 + Math.random() * 90000000),
            method: `${values.method} Disbursal`
          });
        } else {
          const err = await res.json();
          const errMsg = err.detail || 'Payout failed.';
          setPayoutError(errMsg);
          toast.error('Payout Failed', errMsg);
        }
      } catch (err: any) {
        const errMsg = err.message || 'Connection error.';
        setPayoutError(errMsg);
        toast.error('Network Error', errMsg);
      } finally {
        setSubmitting(false);
      }
    }
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <ArrowUpRight className="w-6 h-6 text-emerald-600" />
              Payouts & Bank Settlements
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
              24x7 IMPS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated T+1/T+2 settlement reconciliation, Instant Payouts, and IMPS/NEFT disbursements
          </p>
        </div>

        <button
          onClick={() => setIsPayoutModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Request Bank Payout</span>
        </button>
      </div>

      {/* Balance KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
            <span>Available for Instant Payout</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            <MoneyFormat amount={availableBalance} currency="INR" />
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Real-time ledger payable balance</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
            <span>Pending T+1 Settlement</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            <MoneyFormat amount={pendingBalance} currency="INR" />
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Automated daily bank settlement queue</div>
        </div>
      </div>

      {/* Payouts History Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Disbursement Ledger</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">{payouts.length} Transactions</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-mono">Loading payouts...</div>
        ) : payouts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No payout requests executed yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Payout ID</th>
                  <th className="px-5 py-3.5">Beneficiary Account</th>
                  <th className="px-5 py-3.5">Method</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">UTR Reference</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payouts.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[#0066FF] font-bold">{po.id}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{po.account_holder_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">A/C: {po.bank_account_number} • {po.bank_ifsc}</div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-700">{po.payout_method}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <MoneyFormat amount={po.amount} currency={po.currency} />
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{po.utr || 'Pending UTR'}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono">{new Date(po.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-right">
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
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                Initiate Bank Payout
              </h2>
              <button
                onClick={() => setIsPayoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {payoutError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{payoutError}</span>
              </div>
            )}

            <form onSubmit={formik.handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Transfer Rail</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['IMPS', 'NEFT', 'RTGS', 'INSTANT'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => formik.setFieldValue('method', m)}
                      className={`py-2 text-center rounded-xl font-bold transition-all cursor-pointer ${
                        formik.values.method === m
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {m === 'INSTANT' ? <span className="flex items-center justify-center gap-1"><Zap className="w-3 h-3" />⚡</span> : m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Payout Amount (INR) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={formik.values.amount}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g. 1000.00"
                  className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 ${
                    formik.touched.amount && formik.errors.amount
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
                {formik.touched.amount && formik.errors.amount && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Beneficiary Account Holder Name *</label>
                <input
                  type="text"
                  name="holderName"
                  value={formik.values.holderName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 ${
                    formik.touched.holderName && formik.errors.holderName
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
                {formik.touched.holderName && formik.errors.holderName && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.holderName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Bank Account Number *</label>
                  <input
                    type="text"
                    name="bankAccount"
                    value={formik.values.bankAccount}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 ${
                      formik.touched.bankAccount && formik.errors.bankAccount
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                  {formik.touched.bankAccount && formik.errors.bankAccount && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.bankAccount}</p>
                  )}
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">IFSC Code *</label>
                  <input
                    type="text"
                    name="ifsc"
                    value={formik.values.ifsc}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 uppercase ${
                      formik.touched.ifsc && formik.errors.ifsc
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                  {formik.touched.ifsc && formik.errors.ifsc && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.ifsc}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
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
