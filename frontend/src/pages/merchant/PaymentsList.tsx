import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, X, RotateCcw } from 'lucide-react';
import api from '../../services/api';
import { MoneyFormat } from '../../components/MoneyFormat';
import { StatusBadge } from '../../components/StatusBadge';

export const PaymentsList: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
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

  const filtered = payments.filter(p =>
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
    p.status.toLowerCase().includes(search.toLowerCase())
  );

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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Payments</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage customer payment intents, inspect risk scores & execute refunds</p>
        </div>
        <button
          onClick={fetchPayments}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Payment ID (pi_...), description, or status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Payment Intent ID</th>
                <th className="px-5 py-3.5">Description</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Refunded</th>
                <th className="px-5 py-3.5">Method</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-500">No payment intents found matching your criteria.</td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-indigo-400 font-semibold">{p.id}</td>
                    <td className="px-5 py-3.5 text-slate-200">{p.description || 'N/A'}</td>
                    <td className="px-5 py-3.5 font-bold">
                      <MoneyFormat amount={p.amount} currency={p.currency} />
                    </td>
                    <td className="px-5 py-3.5 text-purple-400 font-mono">
                      {p.refunded_amount > 0 ? <MoneyFormat amount={p.refunded_amount} currency={p.currency} /> : '-'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-400">{p.selected_payment_method || 'CARD'}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => { setSelectedPayment(p); setRefundAmount((p.amount/100).toString()); setRefundMsg(''); }}
                        className="px-2.5 py-1 rounded bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-all font-medium text-[11px]"
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

      {selectedPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl glass-card rounded-2xl p-6 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-slate-400 font-mono uppercase">Payment Intent Details</span>
                <h3 className="text-lg font-bold text-white font-mono">{selectedPayment.id}</h3>
              </div>
              <button onClick={() => setSelectedPayment(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Total Amount</span>
                <MoneyFormat amount={selectedPayment.amount} currency={selectedPayment.currency} className="text-base font-bold text-white" />
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Status</span>
                <StatusBadge status={selectedPayment.status} className="mt-1" />
              </div>
            </div>

            {['SUCCEEDED', 'PARTIALLY_REFUNDED'].includes(selectedPayment.status) && (
              <div className="p-4 bg-purple-950/30 border border-purple-800/40 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-purple-300 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  <span>Issue Refund</span>
                </h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Refund Amount (e.g. 1499.00)"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                  <button
                    onClick={handleIssueRefund}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium text-xs transition"
                  >
                    Execute Refund
                  </button>
                </div>
                {refundMsg && <p className="text-[11px] text-purple-300">{refundMsg}</p>}
              </div>
            )}

            <div className="text-right">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-medium"
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
