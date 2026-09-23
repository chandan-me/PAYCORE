import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Plus, RefreshCw, ShieldCheck, Play } from 'lucide-react';
import api from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';

const webhookEndpointValidationSchema = Yup.object({
  url: Yup.string()
    .trim()
    .required('Payload URL is required')
    .url('Please enter a valid HTTP or HTTPS webhook URL')
    .matches(/^https?:\/\//, 'URL must start with http:// or https://')
});

export const WebhooksView: React.FC = () => {
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [endpointError, setEndpointError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [epResp, delResp] = await Promise.all([
        api.get('/webhooks/endpoints'),
        api.get('/webhooks/deliveries'),
      ]);
      setEndpoints(epResp.data || []);
      setDeliveries(delResp.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formik = useFormik({
    initialValues: {
      url: 'https://example.com/api/paycore-webhook'
    },
    validationSchema: webhookEndpointValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      setEndpointError(null);
      setSubmitting(true);
      try {
        await api.post('/webhooks/endpoints', {
          url: values.url.trim(),
          subscribed_events: ['payment.succeeded', 'payment.failed', 'refund.succeeded', 'dispute.created']
        });
        setShowAddModal(false);
        resetForm();
        fetchData();
      } catch (err: any) {
        console.error(err);
        setEndpointError(err.response?.data?.detail || 'Failed to save webhook endpoint.');
      } finally {
        setSubmitting(false);
      }
    }
  });

  const handleRetryDelivery = async (id: string) => {
    try {
      await api.post(`/webhooks/deliveries/${id}/retry`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Webhooks</h1>
          <p className="text-xs text-slate-400 mt-0.5">Real-time HTTP callbacks with HMAC SHA-256 signatures</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Webhook Endpoint</span>
        </button>
      </div>

      <div className="glass-card p-5 rounded-2xl border-indigo-500/30 space-y-2">
        <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold">
          <ShieldCheck className="w-4 h-4" />
          <span>HMAC SHA-256 Webhook Verification</span>
        </div>
        <p className="text-xs text-slate-300">
          PAYCORE signs all webhook payloads with your endpoint secret in the <code className="text-indigo-300 font-mono">X-Paycore-Signature</code> header. Verify the signature on your server before processing.
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white">Active Webhook Endpoints</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {endpoints.length === 0 ? (
            <div className="col-span-2 glass-card p-6 rounded-2xl text-center text-xs text-slate-500">
              No webhook endpoints configured.
            </div>
          ) : (
            endpoints.map(ep => (
              <div key={ep.id} className="glass-card p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-indigo-400 font-bold truncate max-w-[280px]">{ep.url}</span>
                  <StatusBadge status={ep.is_active ? 'ACTIVE' : 'INACTIVE'} />
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Secret: <span className="text-slate-200">{ep.secret}</span></span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(ep.subscribed_events_json || []).map((evt: string) => (
                    <span key={evt} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                      {evt}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden space-y-2">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-bold text-white">Delivery Logs</h3>
          <button onClick={fetchData} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Delivery ID</th>
                <th className="px-5 py-3.5">HTTP Code</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Attempts</th>
                <th className="px-5 py-3.5">Latency</th>
                <th className="px-5 py-3.5">Created</th>
                <th className="px-5 py-3.5 text-right">Retry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">No webhook delivery events recorded.</td>
                </tr>
              ) : (
                deliveries.map(d => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-indigo-400">{d.id}</td>
                    <td className="px-5 py-3.5 font-mono font-bold">
                      <span className={d.http_status_code === 200 ? 'text-emerald-400' : 'text-rose-400'}>
                        {d.http_status_code || 'ERR'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-5 py-3.5 font-mono">{d.attempt_count}</td>
                    <td className="px-5 py-3.5 font-mono">{d.latency_ms || 0} ms</td>
                    <td className="px-5 py-3.5 font-mono text-slate-400">
                      {new Date(d.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleRetryDelivery(d.id)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1 ml-auto"
                      >
                        <Play className="w-3 h-3 text-indigo-400" />
                        <span>Retry</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">Configure Webhook Endpoint</h3>
            
            {endpointError && (
              <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-lg text-xs text-red-400">
                {endpointError}
              </div>
            )}

            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Payload URL *</label>
                <input
                  type="url"
                  name="url"
                  value={formik.values.url}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 ${
                    formik.touched.url && formik.errors.url
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-800 focus:ring-indigo-500'
                  }`}
                  placeholder="https://example.com/api/paycore-webhook"
                />
                {formik.touched.url && formik.errors.url && (
                  <p className="mt-1 text-[11px] text-rose-400">{formik.errors.url}</p>
                )}
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer transition"
                >
                  {submitting ? 'Saving...' : 'Save Endpoint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
