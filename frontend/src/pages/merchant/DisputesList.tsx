import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  AlertTriangle,
  Clock,
  Upload,
  CheckCircle2,
  Filter,
  ShieldAlert
} from 'lucide-react';
import { MoneyFormat } from '../../components/MoneyFormat';
import { StatusBadge } from '../../components/StatusBadge';

interface Dispute {
  id: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'WON' | 'LOST';
  evidence_details?: any;
  deadline_at: string;
  created_at: string;
}

const evidenceValidationSchema = Yup.object({
  customer_name: Yup.string()
    .trim()
    .required('Customer name is required')
    .min(2, 'Name must be at least 2 characters'),
  customer_email: Yup.string()
    .email('Invalid email address')
    .required('Customer email is required'),
  product_description: Yup.string()
    .trim()
    .required('Product or service description is required')
    .min(5, 'Description must be at least 5 characters'),
  shipping_tracking_number: Yup.string()
    .trim(),
  uncategorized_text: Yup.string()
    .trim()
    .required('Rebuttal explanation and policy references are required')
    .min(10, 'Rebuttal must be at least 10 characters')
});

export const DisputesList: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('paycore_token');
      const url = statusFilter === 'ALL' 
        ? 'http://localhost:8000/v1/disputes' 
        : `http://localhost:8000/v1/disputes?status_filter=${statusFilter}`;
        
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDisputes(data);
      }
    } catch (err) {
      console.error('Failed to load disputes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter]);

  const formik = useFormik({
    initialValues: {
      customer_name: '',
      customer_email: '',
      product_description: '',
      shipping_tracking_number: '',
      uncategorized_text: ''
    },
    validationSchema: evidenceValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      if (!selectedDispute) return;
      setEvidenceError(null);
      try {
        setSubmitting(true);
        const token = localStorage.getItem('paycore_token');
        const res = await fetch(`http://localhost:8000/v1/disputes/${selectedDispute.id}/evidence`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            customer_name: values.customer_name.trim(),
            customer_email: values.customer_email.trim(),
            product_description: values.product_description.trim(),
            shipping_tracking_number: values.shipping_tracking_number.trim() || undefined,
            uncategorized_text: values.uncategorized_text.trim()
          })
        });

        if (res.ok) {
          setSubmitSuccess(true);
          setTimeout(() => {
            setIsEvidenceModalOpen(false);
            setSubmitSuccess(false);
            resetForm();
            fetchDisputes();
          }, 1500);
        } else {
          const errData = await res.json();
          setEvidenceError(errData.detail || 'Evidence submission failed.');
        }
      } catch (err: any) {
        console.error('Evidence submission failed', err);
        setEvidenceError(err.message || 'Connection error.');
      } finally {
        setSubmitting(false);
      }
    }
  });

  const getRemainingDays = (deadline: string) => {
    const diff = new Date(deadline).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days left` : 'Deadline Passed';
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Disputes & Chargebacks
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review customer chargebacks, submit rebuttal evidence, and track bank resolution deadlines.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs font-semibold rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open (Action Needed)</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="WON">Won (Defended)</option>
            <option value="LOST">Lost</option>
          </select>
        </div>
      </div>

      {/* Disputes Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm font-mono">Loading dispute records...</div>
        ) : disputes.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <div className="text-slate-300 font-semibold text-sm">No Disputes Found</div>
            <div className="text-slate-500 text-xs mt-1">Your merchant account is in good standing with zero open chargebacks.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Dispute ID & Date</th>
                  <th className="px-6 py-3.5">Payment Intent</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Reason</th>
                  <th className="px-6 py-3.5">Deadline</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {disputes.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-indigo-400 font-medium">{d.id}</div>
                      <div className="text-[11px] text-slate-500">{new Date(d.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400">{d.payment_intent_id}</td>
                    <td className="px-6 py-4 font-bold text-white">
                      <MoneyFormat amount={d.amount} currency={d.currency} />
                    </td>
                    <td className="px-6 py-4 capitalize">{d.reason.replace('_', ' ')}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock className="w-3 h-3" />
                        {getRemainingDays(d.deadline_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {d.status === 'OPEN' ? (
                        <button
                          onClick={() => {
                            setSelectedDispute(d);
                            setIsEvidenceModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors inline-flex items-center gap-1.5 shadow-sm shadow-indigo-600/30"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Submit Evidence
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedDispute(d)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submit Evidence Modal */}
      {isEvidenceModalOpen && selectedDispute && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-400" />
              Submit Chargeback Evidence — {selectedDispute.id}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Provide verifiable customer communications, delivery tracking, and service agreements to challenge this dispute.
            </p>

            {submitSuccess ? (
              <div className="my-8 text-center text-emerald-400 font-semibold text-sm flex flex-col items-center gap-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-bounce" />
                Evidence successfully submitted for bank review!
              </div>
            ) : (
              <form onSubmit={formik.handleSubmit} className="mt-5 space-y-4 text-xs">
                {evidenceError && (
                  <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-lg text-xs text-red-400">
                    {evidenceError}
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Customer Name *</label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formik.values.customer_name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="e.g. John Doe"
                    className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 ${
                      formik.touched.customer_name && formik.errors.customer_name
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-slate-800 focus:ring-indigo-500'
                    }`}
                  />
                  {formik.touched.customer_name && formik.errors.customer_name && (
                    <p className="mt-1 text-[11px] text-rose-400">{formik.errors.customer_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Customer Email *</label>
                  <input
                    type="email"
                    name="customer_email"
                    value={formik.values.customer_email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="e.g. john@example.com"
                    className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 ${
                      formik.touched.customer_email && formik.errors.customer_email
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-slate-800 focus:ring-indigo-500'
                    }`}
                  />
                  {formik.touched.customer_email && formik.errors.customer_email && (
                    <p className="mt-1 text-[11px] text-rose-400">{formik.errors.customer_email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Product / Service Description *</label>
                  <input
                    type="text"
                    name="product_description"
                    value={formik.values.product_description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="e.g. Enterprise Cloud Annual Subscription License"
                    className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 ${
                      formik.touched.product_description && formik.errors.product_description
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-slate-800 focus:ring-indigo-500'
                    }`}
                  />
                  {formik.touched.product_description && formik.errors.product_description && (
                    <p className="mt-1 text-[11px] text-rose-400">{formik.errors.product_description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Shipping / Fulfillment Tracking Number (Optional)</label>
                  <input
                    type="text"
                    name="shipping_tracking_number"
                    value={formik.values.shipping_tracking_number}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="e.g. FEDEX-897621245 or Digital Access Logs URL"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Rebuttal Explanation & Terms Reference *</label>
                  <textarea
                    rows={3}
                    name="uncategorized_text"
                    value={formik.values.uncategorized_text}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Explain why this charge was authorized and reference your refund/cancellation policies..."
                    className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 ${
                      formik.touched.uncategorized_text && formik.errors.uncategorized_text
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-slate-800 focus:ring-indigo-500'
                    }`}
                  />
                  {formik.touched.uncategorized_text && formik.errors.uncategorized_text && (
                    <p className="mt-1 text-[11px] text-rose-400">{formik.errors.uncategorized_text}</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEvidenceModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {submitting ? 'Submitting Evidence...' : 'Submit to Bank'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
