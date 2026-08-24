import React, { useState, useEffect } from 'react';
import { ShieldCheck, Scale, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metResp, logResp, recResp] = await Promise.all([
        api.get('/admin/metrics'),
        api.get('/admin/audit-logs'),
        api.get('/admin/reconciliation'),
      ]);
      setMetrics(metResp.data);
      setAuditLogs(logResp.data || []);
      setReconciliation(recResp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Admin Console</h1>
          <p className="text-xs text-slate-400 mt-0.5">System-wide GMV, active merchants, audit trail & reconciliation</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Gross Volume (GMV)</span>
          <div className="text-2xl font-black text-white">{metrics?.gmv_formatted || '₹0.00'}</div>
          <span className="text-[11px] text-emerald-400 mt-1 block font-medium">Platform Succeeded GMV</span>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Active Merchants</span>
          <div className="text-2xl font-black text-indigo-300">{metrics?.total_merchants || 0}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Registered & Onboarded</span>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">System Success Rate</span>
          <div className="text-2xl font-black text-emerald-400">{metrics?.success_rate_pct || 100}%</div>
          <span className="text-[11px] text-slate-400 mt-1 block">{metrics?.succeeded_payments || 0} / {metrics?.total_payments || 0} Payments</span>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Provider Health</span>
          <StatusBadge status="HEALTHY" className="mt-1" />
          <span className="text-[11px] text-slate-400 mt-2 block">Sandbox Payment Provider</span>
        </div>
      </div>

      {reconciliation && (
        <div className="glass-card p-5 rounded-2xl border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-white">Automated Reconciliation Tool</h3>
              <p className="text-xs text-slate-400">
                PAYCORE Transactions: <span className="font-mono text-white font-bold">{reconciliation.total_paycore_transactions}</span> | Matched Provider Transactions: <span className="font-mono text-emerald-400 font-bold">{reconciliation.matched_transactions}</span>
              </p>
            </div>
          </div>
          <StatusBadge status={reconciliation.status} />
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Append-Only Financial Audit Trail</span>
          </h3>
          <span className="text-xs text-slate-400">Latest security & financial events</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Actor Type</th>
                <th className="px-5 py-3.5">Resource</th>
                <th className="px-5 py-3.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-500">No audit records found.</td>
                </tr>
              ) : (
                auditLogs.map(a => (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-emerald-400 font-bold">{a.action}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-300">{a.actor_type}</td>
                    <td className="px-5 py-3.5 font-mono text-indigo-300">{a.resource_type} ({a.resource_id})</td>
                    <td className="px-5 py-3.5 font-mono text-slate-400">
                      {new Date(a.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
