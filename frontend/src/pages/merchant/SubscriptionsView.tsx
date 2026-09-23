import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  RefreshCw,
  Plus
} from 'lucide-react';
import { MoneyFormat } from '../../components/MoneyFormat';
import { StatusBadge } from '../../components/StatusBadge';

interface Plan {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  billing_interval: string;
  interval_count: number;
  trial_period_days: number;
}

interface Subscription {
  id: string;
  plan_id: string;
  customer_id: string;
  status: string;
  mandate_type: string;
  mandate_token_reference?: string;
  current_period_end: string;
  completed_cycles: number;
  created_at: string;
}

const planValidationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required('Plan name is required')
    .min(2, 'Name must be at least 2 characters'),
  amount: Yup.number()
    .typeError('Price must be a valid number')
    .positive('Price must be greater than 0')
    .min(1, 'Minimum plan amount is ₹1.00')
    .required('Price is required'),
  billingInterval: Yup.string()
    .oneOf(['DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL'], 'Invalid billing interval')
    .required('Billing interval is required'),
  trialDays: Yup.number()
    .typeError('Trial days must be a number')
    .integer('Must be whole number of days')
    .min(0, 'Trial days cannot be negative')
    .max(365, 'Max 365 trial days')
    .required('Trial days is required')
});

export const SubscriptionsView: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'plans'>('subscriptions');
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('paycore_token');
      const headers = { Authorization: `Bearer ${token}` };

      const [plansRes, subsRes] = await Promise.all([
        fetch('http://localhost:8000/v1/subscriptions/plans', { headers }),
        fetch('http://localhost:8000/v1/subscriptions', { headers })
      ]);

      if (plansRes.ok) setPlans(await plansRes.json());
      if (subsRes.ok) setSubscriptions(await subsRes.json());
    } catch (err) {
      console.error('Failed to load subscriptions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formik = useFormik({
    initialValues: {
      name: '',
      amount: '999.00',
      billingInterval: 'MONTHLY',
      trialDays: 0
    },
    validationSchema: planValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      setPlanError(null);
      try {
        setSubmitting(true);
        const token = localStorage.getItem('paycore_token');
        const minorAmount = Math.round(parseFloat(values.amount as string) * 100);

        const res = await fetch('http://localhost:8000/v1/subscriptions/plans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: values.name.trim(),
            amount: minorAmount,
            currency: 'INR',
            billing_interval: values.billingInterval,
            trial_period_days: Number(values.trialDays)
          })
        });

        if (res.ok) {
          setIsPlanModalOpen(false);
          resetForm();
          fetchData();
        } else {
          const err = await res.json();
          setPlanError(err.detail || 'Failed to create plan.');
        }
      } catch (err: any) {
        console.error('Failed to create plan', err);
        setPlanError(err.message || 'Network error.');
      } finally {
        setSubmitting(false);
      }
    }
  });

  const handleCancelSub = async (subId: string) => {
    try {
      const token = localStorage.getItem('paycore_token');
      const res = await fetch(`http://localhost:8000/v1/subscriptions/${subId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Cancel failed', err);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-indigo-400" />
            Recurring Subscriptions & Mandates
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage recurring billing plans, UPI AutoPay / e-NACH mandates, and customer subscription cycles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlanModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Plan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'subscriptions'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Active Subscriptions ({subscriptions.length})
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'plans'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Billing Plans ({plans.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'subscriptions' ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm font-mono">Loading subscriptions...</div>
          ) : subscriptions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">No active customer subscriptions yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5">Subscription ID</th>
                    <th className="px-6 py-3.5">Customer ID</th>
                    <th className="px-6 py-3.5">Mandate Protocol</th>
                    <th className="px-6 py-3.5">Cycles</th>
                    <th className="px-6 py-3.5">Next Renewal</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-indigo-400 font-medium">{sub.id}</td>
                      <td className="px-6 py-4 font-mono text-slate-400">{sub.customer_id}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                          {sub.mandate_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-white">{sub.completed_cycles} billed</td>
                      <td className="px-6 py-4 text-slate-400 font-mono">
                        {new Date(sub.current_period_end).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {sub.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleCancelSub(sub.id)}
                            className="px-2.5 py-1 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs transition-colors"
                          >
                            Cancel
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div key={p.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl relative">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-bold text-white">{p.name}</h3>
                  <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider block mt-0.5">
                    {p.billing_interval}
                  </span>
                </div>
                <div className="text-xl font-black text-white">
                  <MoneyFormat amount={p.amount} currency={p.currency} />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-1.5">
                <div>Trial Period: <span className="text-white font-semibold">{p.trial_period_days} days</span></div>
                <div className="font-mono text-[11px] text-slate-500">Plan ID: {p.id}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Plan Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              Create Subscription Plan
            </h2>

            {planError && (
              <div className="mt-3 p-3 bg-red-950/50 border border-red-500/30 rounded-lg text-xs text-red-400">
                {planError}
              </div>
            )}

            <form onSubmit={formik.handleSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Plan Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g. Pro Monthly Tier"
                  className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 ${
                    formik.touched.name && formik.errors.name
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-800 focus:ring-indigo-500'
                  }`}
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="mt-1 text-[11px] text-rose-400">{formik.errors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Price (INR) *</label>
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
                  <label className="block text-slate-400 font-medium mb-1">Billing Interval</label>
                  <select
                    name="billingInterval"
                    value={formik.values.billingInterval}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Trial Period (Days)</label>
                <input
                  type="number"
                  min="0"
                  name="trialDays"
                  value={formik.values.trialDays}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 ${
                    formik.touched.trialDays && formik.errors.trialDays
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-800 focus:ring-indigo-500'
                  }`}
                />
                {formik.touched.trialDays && formik.errors.trialDays && (
                  <p className="mt-1 text-[11px] text-rose-400">{formik.errors.trialDays}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
