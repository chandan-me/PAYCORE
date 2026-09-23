import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, X, RotateCcw, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { MoneyFormat } from '../../components/MoneyFormat';
import { StatusBadge } from '../../components/StatusBadge';

export const PaymentsList: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'ALL' | 'SUCCEEDED' | 'PENDING' | 'FAILED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMsg, setRefundMsg] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const resp = await api.get('/payment_intents');
      setPayments(resp.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filtered = payments.filter(p => {
    const matchesSearch =
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
      p.status.toLowerCase().includes(search.toLowerCase());

    if (statusTab === 'ALL') return matchesSearch;
    if (statusTab === 'SUCCEEDED') return matchesSearch && p.status === 'SUCCEEDED';
    if (statusTab === 'PENDING') return matchesSearch && ['REQUIRES_PAYMENT_METHOD', 'REQUIRES_CONFIRMATION', 'PROCESSING'].includes(p.status);
    if (statusTab === 'FAILED') return matchesSearch && ['FAILED', 'CANCELED'].includes(p.status);
    return matchesSearch;
  });

  const handleIssueRefund = async () => {
    if (!selectedPayment) return;
    const paiseAmount = Math.round(parseFloat(refundAmount) * 100);
    try {
      await api.post('/refunds', {
        payment_intent_id: selectedPayment.id,
        amount: paiseAmount,
        reason: 'Merchant dashboard manual refund'
      });
      setRefundMsg('Refund issued successfully!');
      fetchPayments();
      setTimeout(() => setRefundMsg(''), 3000);
    } catch (err: any) {
      setRefundMsg(err.response?.data?.detail || 'Refund failed.');
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payments & Collections</h1>
          <p className="text-xs text-slate-500 mt-0.5">Inspect all customer transactions, payment methods & initiate instant refunds</p>
        </div>
        <button
          onClick={fetchPayments}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-all shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0066FF]' : ''}`} />
          <span>Sync Transactions</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center p-1 bg-white rounded-xl border border-slate-200 text-xs self-start shadow-2xs">
          {[
            { key: 'ALL', label: 'All Orders' },
            { key: 'SUCCEEDED', label: 'Success', icon: CheckCircle2, color: 'text-emerald-600' },
            { key: 'PENDING', label: 'Processing', icon: Clock, color: 'text-amber-500' },
            { key: 'FAILED', label: 'Failed', icon: AlertCircle, color: 'text-rose-600' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                statusTab === tab.key
                  ? 'bg-[#0066FF] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Payment ID (pi_...), description, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0066FF] transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Payment Intent ID</th>
                <th className="px-5 py-3.5">Description</th>
                <th className="px-5 py-3.5">Gross Amount</th>
                <th className="px-5 py-3.5">Refunded</th>
                <th className="px-5 py-3.5">Method</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400 font-medium">
                    No payment intents found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-[#0066FF] font-semibold">{p.id}</td>
                    <td className="px-5 py-3.5 text-slate-800 font-medium">{p.description || 'Order checkout'}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <MoneyFormat amount={p.amount} currency={p.currency} />
                    </td>
                    <td className="px-5 py-3.5 text-[#6851FF] font-mono">
                      {p.refunded_amount > 0 ? <MoneyFormat amount={p.refunded_amount} currency={p.currency} /> : '-'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">{p.selected_payment_method || 'CARD'}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => { setSelectedPayment(p); setRefundAmount((p.amount/100).toString()); setRefundMsg(''); }}
                        className="px-3 py-1 rounded-lg bg-blue-50 text-[#0066FF] border border-blue-200 hover:bg-[#0066FF] hover:text-white transition-all font-semibold text-[11px]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect / Refund Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl p-6 border border-slate-200 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Payment Details</span>
                <h3 className="text-base font-bold text-slate-900 font-mono mt-0.5">{selectedPayment.id}</h3>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-1">Total Amount</span>
                <MoneyFormat amount={selectedPayment.amount} currency={selectedPayment.currency} className="text-lg font-bold text-slate-900" />
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-1">Status</span>
                <StatusBadge status={selectedPayment.status} className="mt-0.5" />
              </div>
            </div>

            {['SUCCEEDED', 'PARTIALLY_REFUNDED'].includes(selectedPayment.status) && (
              <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-purple-900 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-[#6851FF]" />
                  <span>Execute Instant Refund</span>
                </h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Refund Amount (e.g. 1499.00)"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-[#6851FF]"
                  />
                  <button
                    onClick={handleIssueRefund}
                    className="px-4 py-1.5 bg-[#6851FF] hover:bg-[#573fed] text-white rounded-xl font-semibold text-xs transition-all shadow-xs"
                  >
                    Refund Order
                  </button>
                </div>
                {refundMsg && <p className="text-[11px] text-purple-700 font-medium">{refundMsg}</p>}
              </div>
            )}

            <div className="text-right">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
