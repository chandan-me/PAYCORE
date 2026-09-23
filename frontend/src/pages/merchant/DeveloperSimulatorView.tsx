import React, { useState } from 'react';
import { Terminal, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const DeveloperSimulatorView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [amountInput, setAmountInput] = useState('2499.00');
  const toast = useToast();

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

      if (eventType === 'payment_success') {
        toast.payment({
          title: 'Simulated Payment Succeeded',
          message: 'Double-entry ledger journal posted and webhook payment.succeeded dispatched.',
          amount: paise,
          currency: 'INR',
          status: 'SUCCESS',
          utr: resp.data?.utr || 'SIM_UTR_' + Math.floor(100000 + Math.random() * 900000),
          method: 'Card / UPI Sandbox'
        });
      } else if (eventType === 'payment_failed') {
        toast.error(
          'Simulated Card Decline',
          'Simulated card transaction declined. Webhook payment.failed queued for delivery.',
          `ERR_CARD_DECLINED_${Date.now()}`
        );
      } else if (eventType === 'dispute') {
        toast.warning(
          'Chargeback Dispute Triggered',
          `Dispute of ₹${amountInput} created with 7-day evidence submission window.`
        );
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Simulation error';
      setResult({ status: 'ERROR', message: errMsg });
      toast.error('Simulation Failed', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Developer Sandbox Event Simulator</h1>
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
            Interactive Testbed
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Trigger end-to-end sandbox payments, failures, refunds, and disputes to test your webhook listeners and state machine reconciliation
        </p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
          Simulated Transaction Amount (INR)
        </label>
        <div className="flex items-center gap-3 max-w-sm">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">₹</span>
            <input
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/20 focus:border-[#0066FF]"
              placeholder="2499.00"
            />
          </div>
          <span className="text-xs font-mono text-slate-400">({Math.round(parseFloat(amountInput || '0') * 100)} paise)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Payment Success */}
        <button
          onClick={() => triggerSimulation('payment_success')}
          disabled={loading}
          className="p-5 bg-white rounded-2xl border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all text-left space-y-3 cursor-pointer group hover-lift active:scale-98"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 group-hover:scale-105 transition">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition">
              Simulate Payment Success
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Triggers card payment, posts double-entry ledger journals, and fires <code className="text-emerald-700 font-mono bg-emerald-50 px-1 py-0.5 rounded">payment.succeeded</code> webhook.
            </p>
          </div>
        </button>

        {/* Payment Failure */}
        <button
          onClick={() => triggerSimulation('payment_failed')}
          disabled={loading}
          className="p-5 bg-white rounded-2xl border border-rose-200 hover:border-rose-400 hover:shadow-md transition-all text-left space-y-3 cursor-pointer group hover-lift active:scale-98"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 group-hover:scale-105 transition">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-rose-700 transition">
              Simulate Payment Failure
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Simulates card decline / insufficient funds and dispatches <code className="text-rose-700 font-mono bg-rose-50 px-1 py-0.5 rounded">payment.failed</code> webhook.
            </p>
          </div>
        </button>

        {/* Dispute */}
        <button
          onClick={() => triggerSimulation('dispute')}
          disabled={loading}
          className="p-5 bg-white rounded-2xl border border-amber-200 hover:border-amber-400 hover:shadow-md transition-all text-left space-y-3 cursor-pointer group hover-lift active:scale-98"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 group-hover:scale-105 transition">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-800 transition">
              Simulate Chargeback Dispute
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Creates simulated chargeback claim and dispatches <code className="text-amber-800 font-mono bg-amber-50 px-1 py-0.5 rounded">dispute.created</code> webhook.
            </p>
          </div>
        </button>
      </div>

      {loading && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-center text-slate-600 gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-[#0066FF]" />
          <span className="text-xs font-mono font-bold">Executing sandbox simulation pipeline & dispatching webhooks...</span>
        </div>
      )}

      {result && (
        <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 shadow-lg space-y-3 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300 text-xs font-mono font-bold uppercase">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Simulation Pipeline Response</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              HTTP 200 OK
            </span>
          </div>
          <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
