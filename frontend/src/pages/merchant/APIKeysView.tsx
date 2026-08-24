import React, { useState, useEffect } from 'react';
import { Plus, Copy, Check, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';

export const APIKeysView: React.FC = () => {
  const [keys, setKeys] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState('Backend Service Key');
  const [keyType, setKeyType] = useState<'SECRET' | 'PUBLISHABLE'>('SECRET');
  
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = async () => {
    try {
      const resp = await api.get('/api_keys');
      setKeys(resp.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async () => {
    try {
      const resp = await api.post('/api_keys', {
        name: keyName,
        key_type: keyType,
        mode: 'TEST'
      });
      setRevealedSecret(resp.data.secret_key);
      setShowCreateModal(false);
      fetchKeys();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      await api.delete(`/api_keys/${id}/revoke`);
      fetchKeys();
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">API Keys</h1>
          <p className="text-xs text-slate-400 mt-0.5">Publishable & Secret API keys for authenticating HTTP API calls</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create New API Key</span>
        </button>
      </div>

      {revealedSecret && (
        <div className="p-5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
            <ShieldAlert className="w-5 h-5" />
            <span>New Secret Key Generated — Copy Immediately!</span>
          </div>
          <p className="text-xs text-slate-300">
            For security reasons, this secret key will <strong>never be displayed again</strong>. Store it securely in your environment variables.
          </p>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-3">
            <code className="flex-1 font-mono text-xs text-emerald-300 break-all">{revealedSecret}</code>
            <button
              onClick={() => copyToClipboard(revealedSecret)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Key'}</span>
            </button>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Key Prefix</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Mode</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Created</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">No API keys created yet.</td>
                </tr>
              ) : (
                keys.map(k => (
                  <tr key={k.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-white">{k.name}</td>
                    <td className="px-5 py-3.5 font-mono text-indigo-400">{k.key_prefix}...</td>
                    <td className="px-5 py-3.5 font-mono text-slate-300">{k.key_type}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-700 text-amber-400 font-mono text-[10px] font-bold">
                        {k.mode}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={k.is_active ? 'ACTIVE' : 'REVOKED'} />
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-400">
                      {new Date(k.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {k.is_active && (
                        <button
                          onClick={() => handleRevokeKey(k.id)}
                          className="px-2.5 py-1 rounded bg-rose-950/40 text-rose-400 border border-rose-800/40 hover:bg-rose-900/60 transition text-[11px] font-medium"
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

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">Create New API Key</h3>
            
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Key Description / Name</label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Key Type</label>
              <select
                value={keyType}
                onChange={(e: any) => setKeyType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="SECRET">Secret Key (sk_test_...)</option>
                <option value="PUBLISHABLE">Publishable Key (pk_test_...)</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKey}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
              >
                Generate Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
