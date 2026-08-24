import React, { useState } from 'react';
import { Terminal, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../../services/api';

export const DeveloperSimulatorView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [amountInput, setAmountInput] = useState('1499.00');

  const triggerSimulation = async (eventType: string) => {
    setLoading(true);
    setResult(null);
    try {
      const paise = Math.round(parseFloat(amountInput) * 100);
      const resp = await api.post('/simulator/event', {
        event_type: eventType,
        amount: paise,
        description: `Simulated ${eventType} event`
      });
      setResult(resp.data);
    } catch (err: any) {
      setResult({ status: 'ERROR', message: err.response?.data?.detail || 'Simulation error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Developer Sandbox Event Simulator</h1>
        <p className="text-xs text-slate-400 mt-0.5">Trigger end-to-end sandbox payments, failures, and disputes to test your integration</p>
      </div>

      <div className="glass-card p-5 rounded-2xl space-y-3">
        <label className="block text-xs font-semibold text-slate-300 uppercase">Simulated Transaction Amount (INR)</label>
        <div className="flex gap-3 max-w-sm">
          <input
            type="number"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono"
            placeholder="1499.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => triggerSimulation('payment_success')}
          disabled={loading}
          className="p-5 glass-card rounded-2xl glass-card-hover text-left space-y-2 border-emerald-500/30 hover:bg-emerald-950/20 transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 transition">Simulate Payment Success</h3>
          <p className="text-xs text-slate-400">Triggers card payment, posts double-entry ledger journals, and fires <code className="text-emerald-300 font-mono">payment.succeeded</code> webhook.</p>
        </button>

        <button
          onClick={() => triggerSimulation('payment_failed')}
          disabled={loading}
          className="p-5 glass-card rounded-2xl glass-card-hover text-left space-y-2 border-rose-500/30 hover:bg-rose-950/20 transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <XCircle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm group-hover:text-rose-400 transition">Simulate Payment Failure</h3>
          <p className="text-xs text-slate-400">Simulates card decline / insufficient funds and dispatches <code className="text-rose-300 font-mono">payment.failed</code> webhook.</p>
        </button>

        <button
          onClick={() => triggerSimulation('dispute')}
          disabled={loading}
          className="p-5 glass-card rounded-2xl glass-card-hover text-left space-y-2 border-amber-500/30 hover:bg-amber-950/20 transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-sm group-hover:text-amber-400 transition">Simulate Chargeback Dispute</h3>
          <p className="text-xs text-slate-400">Creates simulated chargeback claim and dispatches <code className="text-amber-300 font-mono">dispute.created</code> webhook.</p>
        </button>
      </div>

      {loading && (
        <div className="glass-card p-6 rounded-2xl flex items-center justify-center text-slate-300 gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          <span className="text-sm font-mono">Executing sandbox simulation pipeline...</span>
        </div>
      )}

      {result && (
        <div className="glass-card p-5 rounded-2xl border-indigo-500/40 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold uppercase">
            <Terminal className="w-4 h-4" />
            <span>Simulation Pipeline Response</span>
          </div>
          <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
