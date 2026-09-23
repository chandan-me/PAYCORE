import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Plus, Copy, Check, ShieldAlert, Key, Zap } from 'lucide-react';
import api from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../context/ToastContext';

const apiKeyValidationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required('Key name / description is required')
    .min(3, 'Name must be at least 3 characters'),
  keyType: Yup.string()
    .oneOf(['SECRET', 'PUBLISHABLE'], 'Invalid key type')
    .required('Key type is required')
});

export const APIKeysView: React.FC = () => {
  const [keys, setKeys] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const toast = useToast();

  const fetchKeys = async () => {
    try {
      const resp = await api.get('/api_keys');
      setKeys(resp.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load API keys', 'Could not retrieve API keys from server');
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const formik = useFormik({
    initialValues: {
      name: 'Backend Service Key',
      keyType: 'SECRET' as 'SECRET' | 'PUBLISHABLE'
    },
    validationSchema: apiKeyValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      setCreateError(null);
      setLoading(true);
      try {
        const resp = await api.post('/api_keys', {
          name: values.name.trim(),
          key_type: values.keyType,
          mode: 'TEST'
        });
        setRevealedSecret(resp.data.secret_key);
        setShowCreateModal(false);
        resetForm();
        fetchKeys();
        toast.success(
          'API Key Generated Successfully',
          `${values.keyType} key "${values.name}" is now ready for authentication`,
          resp.data.secret_key
        );
      } catch (err: any) {
        console.error(err);
        const errMsg = err.response?.data?.detail || 'Failed to create API key.';
        setCreateError(errMsg);
        toast.error('Key Creation Failed', errMsg);
      } finally {
        setLoading(false);
      }
    }
  });

  const handleRevokeKey = async (id: string, name: string) => {
    try {
      await api.delete(`/api_keys/${id}/revoke`);
      fetchKeys();
      toast.warning('API Key Revoked', `Key "${name}" has been disabled and will reject further API requests.`);
    } catch (err: any) {
      console.error(err);
      toast.error('Revocation Failed', err.response?.data?.detail || 'Could not revoke API key.');
    }
  };

  const copyToClipboard = (text: string, label = 'Secret Key') => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.copied(text, `${label} Copied`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">API Keys & Authentication</h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0066FF] border border-blue-200 text-[10px] font-mono font-bold">
              v1.4 REST
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Publishable & Secret API keys for authenticating server-to-server and client-side payments
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer active:scale-95 w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Key</span>
        </button>
      </div>

      {revealedSecret && (
        <div className="p-5 bg-emerald-50/80 border border-emerald-300 rounded-2xl space-y-3 shadow-sm animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 text-sm font-bold">
              <ShieldAlert className="w-5 h-5 text-emerald-600" />
              <span>New Secret Key Generated — Copy Immediately!</span>
            </div>
            <button
              onClick={() => setRevealedSecret(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-emerald-900">
            For security reasons, this secret key will <strong>never be displayed again</strong>. Store it securely in your environment secrets (`PAYCORE_SECRET_KEY`).
          </p>
          <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded-xl p-3 shadow-inner">
            <code className="flex-1 font-mono text-xs text-emerald-700 font-bold break-all">{revealedSecret}</code>
            <button
              onClick={() => copyToClipboard(revealedSecret, 'Secret Key')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Key'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Keys Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-[#0066FF]" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Active Credentials</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">{keys.length} Keys Configured</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Name / Description</th>
                <th className="px-5 py-3.5">Key Prefix</th>
                <th className="px-5 py-3.5">Key Type</th>
                <th className="px-5 py-3.5">Mode</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Created Date</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 font-medium">
                    No API keys created yet. Generate one to begin testing API integration.
                  </td>
                </tr>
              ) : (
                keys.map(k => (
                  <tr key={k.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{k.name}</td>
                    <td className="px-5 py-3.5 font-mono text-[#0066FF] font-semibold">
                      <button
                        onClick={() => copyToClipboard(k.key_prefix, 'Key Prefix')}
                        className="hover:underline flex items-center gap-1 cursor-pointer"
                        title="Click to copy prefix"
                      >
                        <span>{k.key_prefix}...</span>
                        <Copy className="w-3 h-3 text-slate-400" />
                      </button>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600 font-medium">{k.key_type}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-mono text-[10px] font-bold">
                        {k.mode || 'TEST'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={k.is_active ? 'ACTIVE' : 'REVOKED'} />
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">
                      {new Date(k.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {k.is_active && (
                        <button
                          onClick={() => handleRevokeKey(k.id, k.name)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition text-[11px] font-semibold cursor-pointer"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Integration Reference Guide */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/60 to-indigo-50/60 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#0066FF]" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Developer Integration Quickstart</h3>
          </div>
          <p className="text-xs text-slate-600">
            Pass your Secret Key in the <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[#0066FF]">Authorization: Bearer sk_test_...</code> HTTP header.
          </p>
        </div>
        <button
          onClick={() => copyToClipboard('Authorization: Bearer sk_test_987654321', 'Header snippet')}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 transition shadow-2xs cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Copy className="w-3.5 h-3.5 text-[#0066FF]" />
          <span>Copy Header Snippet</span>
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Generate New API Key</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {createError}
              </div>
            )}

            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Key Description / Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g., Node.js Server Backend"
                  className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 ${
                    formik.touched.name && formik.errors.name
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-slate-200 focus:ring-[#0066FF]/20 focus:border-[#0066FF]'
                  }`}
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">{formik.errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Key Type</label>
                <select
                  name="keyType"
                  value={formik.values.keyType}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF] cursor-pointer font-medium"
                >
                  <option value="SECRET">Secret Key (sk_test_...) — Full Server API Access</option>
                  <option value="PUBLISHABLE">Publishable Key (pk_test_...) — Client Checkout Elements</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold cursor-pointer transition shadow-md shadow-blue-600/20 active:scale-95"
                >
                  {loading ? 'Generating...' : 'Generate Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
