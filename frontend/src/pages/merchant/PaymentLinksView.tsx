import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Link as LinkIcon,
  Plus,
  Copy,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { MoneyFormat } from '../../components/MoneyFormat';
import { StatusBadge } from '../../components/StatusBadge';

interface PaymentLink {
  id: string;
  title: string;
  amount: number;
  currency: string;
  slug: string;
  short_url: string;
  status: string;
  expires_at?: string;
  created_at: string;
}

const paymentLinkValidationSchema = Yup.object({
  title: Yup.string()
    .trim()
    .required('Purpose or title is required')
    .min(3, 'Title must be at least 3 characters'),
  amount: Yup.number()
    .typeError('Amount must be a valid number')
    .positive('Amount must be greater than 0')
    .min(1, 'Minimum amount is ₹1.00')
    .required('Amount is required'),
  customerEmail: Yup.string()
    .email('Invalid email address')
    .nullable(),
  expiresInDays: Yup.number()
    .typeError('Expiry must be a number')
    .integer('Must be a whole number of days')
    .min(1, 'Minimum expiry is 1 day')
    .max(365, 'Maximum expiry is 365 days')
    .required('Expiry days are required'),
  description: Yup.string()
    .max(500, 'Description cannot exceed 500 characters')
});

export const PaymentLinksView: React.FC = () => {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('paycore_token');
      const res = await fetch('http://localhost:8000/v1/payment-links', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLinks(data);
      }
    } catch (err) {
      console.error('Failed to load payment links', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formik = useFormik({
    initialValues: {
      title: '',
      amount: '',
      customerEmail: '',
      expiresInDays: 7,
      description: ''
    },
    validationSchema: paymentLinkValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      setSubmitting(true);
      setFormError(null);
      try {
        const token = localStorage.getItem('paycore_token');
        const minorAmount = Math.round(parseFloat(values.amount as string) * 100);

        const res = await fetch('http://localhost:8000/v1/payment-links', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title: values.title.trim(),
            amount: minorAmount,
            currency: 'INR',
            description: values.description.trim() || undefined,
            customer_email: values.customerEmail?.trim() || undefined,
            expires_in_days: Number(values.expiresInDays)
          })
        });

        if (res.ok) {
          setIsCreateOpen(false);
          resetForm();
          fetchLinks();
        } else {
          const errData = await res.json();
          setFormError(errData.detail || 'Failed to create payment link.');
        }
      } catch (err: any) {
        console.error('Failed to create link', err);
        setFormError(err.message || 'Network error.');
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
            <LinkIcon className="w-6 h-6 text-indigo-400" />
            Shareable Payment Links
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Create instant hosted checkout links to share with customers across WhatsApp, Email, or SMS.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Payment Link
        </button>
      </div>

      {/* Links List */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm font-mono">Loading payment links...</div>
        ) : links.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No payment links created yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Title & Reference</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Hosted URL</th>
                  <th className="px-6 py-3.5">Expires</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {links.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{link.title}</div>
                      <div className="font-mono text-[11px] text-indigo-400">{link.slug}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      <MoneyFormat amount={link.amount} currency={link.currency} />
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-400 truncate max-w-xs">
                      {link.short_url}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono">
                      {link.expires_at ? new Date(link.expires_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={link.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCopy(link.short_url, link.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          {copiedId === link.id ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              Copy
                            </>
                          )}
                        </button>
                        <a
                          href={link.short_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-indigo-400" />
              Generate Hosted Payment Link
            </h2>

            {formError && (
              <div className="mt-3 p-3 bg-red-950/50 border border-red-500/30 rounded-lg text-xs text-red-400">
                {formError}
              </div>
            )}

            <form onSubmit={formik.handleSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Purpose / Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formik.values.title}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g. Website Design Deposit"
                  className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 ${
                    formik.touched.title && formik.errors.title
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-800 focus:ring-indigo-500'
                  }`}
                />
                {formik.touched.title && formik.errors.title && (
                  <p className="mt-1 text-[11px] text-rose-400">{formik.errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Amount (INR) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={formik.values.amount}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g. 2499.00"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Customer Email (Optional)</label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formik.values.customerEmail}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="e.g. client@example.com"
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
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Expiry (Days) *</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    name="expiresInDays"
                    value={formik.values.expiresInDays}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 ${
                      formik.touched.expiresInDays && formik.errors.expiresInDays
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-slate-800 focus:ring-indigo-500'
                    }`}
                  />
                  {formik.touched.expiresInDays && formik.errors.expiresInDays && (
                    <p className="mt-1 text-[11px] text-rose-400">{formik.errors.expiresInDays}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  name="description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Additional notes for your customer..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {formik.touched.description && formik.errors.description && (
                  <p className="mt-1 text-[11px] text-rose-400">{formik.errors.description}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  {submitting ? 'Generating...' : 'Create Payment Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
