import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Zap, Scale, Terminal, ArrowRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="h-20 border-b border-slate-800/80 px-8 flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-indigo-500/30">
            P
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            PAYCORE
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/docs/api')}
            className="text-xs text-slate-400 hover:text-slate-200 font-medium transition"
          >
            API Reference
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 transition"
          >
            Get Started
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-8 py-20 space-y-20">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-medium">
            <Zap className="w-3.5 h-3.5" />
            <span>Next-Generation Payment Orchestration System</span>
          </div>

          <h1 className="text-5xl font-black tracking-tight text-white leading-tight">
            Payment Infrastructure <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Built for Modern Businesses
            </span>
          </h1>

          <p className="text-base text-slate-400 leading-relaxed">
            PAYCORE provides a production-grade orchestration layer with immutable double-entry financial ledgers, pluggable provider adapters, sandbox simulation engine, and real-time HMAC webhooks.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 flex items-center gap-2 transition"
            >
              <span>Start Building Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition"
            >
              Explore Demo Merchant
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Double-Entry Ledger</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Guarantees strict financial balance across Customer Clearing, Merchant Payable, and Platform Revenue accounts. Zero floating point rounding errors.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Sandbox Provider Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Integrated sandbox payment provider simulating successes, insufficient funds, expired cards, and gateway timeouts without real money risk.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">HMAC Webhooks & Idempotency</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              HMAC SHA-256 event signatures, exponential retry backoff, and strict <code className="text-indigo-300 font-mono">Idempotency-Key</code> payload caching.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-900 py-8 px-8 text-center text-xs text-slate-500">
        PAYCORE Payment Orchestration Platform © 2026. All rights reserved.
      </footer>
    </div>
  );
};
