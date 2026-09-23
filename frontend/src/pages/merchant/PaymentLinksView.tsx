import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Link as LinkIcon,
  Plus,
  Copy,
  CheckCircle2,
  ExternalLink,
  Globe
} from 'lucide-react';
import { MoneyFormat } from '../../components/MoneyFormat';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../context/ToastContext';

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
  const toast = useToast();

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
      toast.error('Failed to Load Links', 'Could not retrieve payment links.');
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
    toast.copied(url, 'Payment Link Copied to Clipboard');
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
          const newLink = await res.json();
          setIsCreateOpen(false);
          resetForm();
          fetchLinks();
          toast.success(
            'Payment Link Created!',
            `Link for "${values.title}" (₹${values.amount}) is ready. Share with your customers.`,
            newLink.short_url
          );
        } else {
          const errData = await res.json();
          const errMsg = errData.detail || 'Failed to create payment link.';
          setFormError(errMsg);
          toast.error('Payment Link Creation Failed', errMsg);
        }
      } catch (err: any) {
        console.error(err);
        setFormError(err.message || 'Network error.');
        toast.error('Network Error', err.message || 'Could not connect to payment link service.');
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
              <LinkIcon className="w-6 h-6 text-[#0066FF]" />
              Shareable Payment Links
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0066FF] border border-blue-200 text-[10px] font-mono font-bold">
              Instant Collect
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create instant hosted checkout links to share with customers across WhatsApp, Email, or SMS with automated reconciliation
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-xs transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create Payment Link</span>
        </button>
      </div>

      {/* Links List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#0066FF]" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Active Links</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">{links.length} Links Active</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-mono">Loading payment links...</div>
        ) : links.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No payment links created yet. Click "Create Payment Link" to start collecting payments.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Title & Reference</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Hosted URL</th>
                  <th className="px-5 py-3.5">Expires</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {links.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{link.title}</div>
                      <div className="font-mono text-[11px] text-[#0066FF]">{link.slug}</div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <MoneyFormat amount={link.amount} currency={link.currency} />
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500 truncate max-w-xs">
                      {link.short_url}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono">
                      {link.expires_at ? new Date(link.expires_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={link.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleCopy(link.short_url, link.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          {copiedId === link.id ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                        <a
                          href={link.short_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-[#0066FF] transition cursor-pointer"
                          title="Open Checkout Page"
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
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-[#0066FF]" />
                Generate Hosted Payment Link
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={formik.handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Purpose / Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formik.values.title}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g. Website Design Invoice"
                  className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 ${
                    formik.touched.title && formik.errors.title
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-slate-200 focus:ring-[#0066FF]/20 focus:border-[#0066FF]'
                  }`}
                />
                {formik.touched.title && formik.errors.title && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Amount (INR) *</label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={formik.values.amount}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g. 2499.00"
                  className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 ${
                    formik.touched.amount && formik.errors.amount
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-slate-200 focus:ring-[#0066FF]/20 focus:border-[#0066FF]'
                  }`}
                />
                {formik.touched.amount && formik.errors.amount && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.amount}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Customer Email (Optional)</label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formik.values.customerEmail}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="e.g. client@example.com"
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 ${
                      formik.touched.customerEmail && formik.errors.customerEmail
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-slate-200 focus:ring-[#0066FF]/20 focus:border-[#0066FF]'
                    }`}
                  />
                  {formik.touched.customerEmail && formik.errors.customerEmail && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.customerEmail}</p>
                  )}
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Expiry (Days) *</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    name="expiresInDays"
                    value={formik.values.expiresInDays}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 ${
                      formik.touched.expiresInDays && formik.errors.expiresInDays
                        ? 'border-rose-400 focus:ring-rose-500'
                        : 'border-slate-200 focus:ring-[#0066FF]/20 focus:border-[#0066FF]'
                    }`}
                  />
                  {formik.touched.expiresInDays && formik.errors.expiresInDays && (
                    <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.expiresInDays}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  name="description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Additional notes for your customer..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF]"
                />
                {formik.touched.description && formik.errors.description && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.description}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer active:scale-95"
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
