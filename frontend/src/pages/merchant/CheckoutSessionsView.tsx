import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Sparkles,
  Plus,
  ExternalLink,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { MoneyFormat } from '../../components/MoneyFormat';
import { StatusBadge } from '../../components/StatusBadge';

const checkoutSessionValidationSchema = Yup.object({
  amount: Yup.number()
    .typeError('Amount must be a valid number')
    .positive('Amount must be greater than 0')
    .min(1, 'Minimum amount is ₹1.00')
    .required('Amount is required'),
  description: Yup.string()
    .trim()
    .required('Order description is required')
    .min(3, 'Description must be at least 3 characters'),
  customerEmail: Yup.string()
    .email('Invalid email address')
    .nullable()
});

export const CheckoutSessionsView: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('paycore_token');
      const res = await fetch('http://localhost:8000/v1/payment-intents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error('Failed to load sessions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const formik = useFormik({
    initialValues: {
      amount: '1499.00',
      description: 'Pro Plan Annual Subscription',
      customerEmail: 'customer@example.com'
    },
    validationSchema: checkoutSessionValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      setSubmitting(true);
      setSessionError(null);
      try {
        const token = localStorage.getItem('paycore_token');
        const minorAmount = Math.round(parseFloat(values.amount as string) * 100);

        // 1. Create Payment Intent
        const piRes = await fetch('http://localhost:8000/v1/payment-intents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: minorAmount,
            currency: 'INR',
            description: values.description.trim()
          })
        });

        if (piRes.ok) {
          const pi = await piRes.json();
          // 2. Create Checkout Session
          const csRes = await fetch('http://localhost:8000/v1/checkout/sessions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              payment_intent_id: pi.id,
              allowed_payment_methods: ['CARD', 'UPI', 'NETBANKING'],
              success_url: 'http://localhost:5173/dashboard/payments',
              cancel_url: 'http://localhost:5173/dashboard'
            })
          });

          if (csRes.ok) {
            setIsCreateOpen(false);
            resetForm();
            fetchSessions();
          } else {
            const errData = await csRes.json();
            setSessionError(errData.detail || 'Failed to create checkout session.');
          }
        } else {
          const errData = await piRes.json();
          setSessionError(errData.detail || 'Failed to create payment intent.');
        }
      } catch (err: any) {
        console.error('Failed to create session', err);
        setSessionError(err.message || 'Connection error.');
      } finally {
        setSubmitting(false);
      }
    }
  });

  const handleCopy = (sessionId: string) => {
    const url = `${window.location.origin}/checkout/${sessionId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            Hosted Checkout Sessions
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Build custom hosted checkout sessions at <code className="text-indigo-300">/checkout/:sessionId</code> supporting Cards, UPI QR, and Net Banking.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Checkout Session
        </button>
      </div>

      {/* Sessions Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm font-mono">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No checkout sessions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Payment Intent ID</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Hosted Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-indigo-400 font-medium">{s.id}</td>
                    <td className="px-6 py-4 font-medium text-white">{s.description || 'Order Payment'}</td>
                    <td className="px-6 py-4 font-bold text-white">
                      <MoneyFormat amount={s.amount} currency={s.currency} />
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCopy(s.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          {copiedId === s.id ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              Copy URL
                            </>
                          )}
                        </button>
                        <a
                          href={`/checkout/${s.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Launch Hosted Checkout Session
            </h2>

            {sessionError && (
              <div className="mt-3 p-3 bg-red-950/50 border border-red-500/30 rounded-lg text-xs text-red-400">
                {sessionError}
              </div>
            )}

            <form onSubmit={formik.handleSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Amount (INR) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={formik.values.amount}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 ${
                    formik.touched.amount && formik.errors.amount
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-800 focus:ring-indigo-500'
                  }`}
                />
                {formik.touched.amount && formik.errors.amount && (
                  <p className="mt-1 text-[11px] text-rose-400">{formik.errors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Order Description *</label>
                <input
                  type="text"
                  name="description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 ${
                    formik.touched.description && formik.errors.description
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-800 focus:ring-indigo-500'
                  }`}
                />
                {formik.touched.description && formik.errors.description && (
                  <p className="mt-1 text-[11px] text-rose-400">{formik.errors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Customer Email (Optional)</label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formik.values.customerEmail}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 ${
                    formik.touched.customerEmail && formik.errors.customerEmail
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-800 focus:ring-indigo-500'
                  }`}
                />
                {formik.touched.customerEmail && formik.errors.customerEmail && (
                  <p className="mt-1 text-[11px] text-rose-400">{formik.errors.customerEmail}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Launch Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
