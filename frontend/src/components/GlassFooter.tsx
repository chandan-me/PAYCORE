import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  Terminal,
  CheckCircle2,
  Lock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const GlassFooter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const toast = useToast();

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.warning('Invalid Email', 'Please enter a valid developer / work email address.');
      return;
    }
    setSubscribed(true);
    toast.success('Subscribed!', 'You are now subscribed to PAYCORE API Changelog & Developer Updates.');
    setEmail('');
  };

  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white pt-16 pb-12 border-t border-slate-800">
      {/* Ambient Glassmorphic Glow Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0066FF]/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Feature Strip: Glassmorphic Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex items-center gap-4 hover:border-blue-500/40 transition duration-300">
            <div className="w-12 h-12 rounded-xl bg-[#0066FF]/20 text-[#0066FF] flex items-center justify-center shrink-0 border border-[#0066FF]/30">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">99.99% Guaranteed SLA</div>
              <div className="text-xs text-slate-400">Multi-region active-active cluster failover</div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex items-center gap-4 hover:border-emerald-500/40 transition duration-300">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">PCI-DSS Level 1 & RBI PA-PG</div>
              <div className="text-xs text-slate-400">Bank-grade end-to-end encryption & tokens</div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex items-center gap-4 hover:border-purple-500/40 transition duration-300">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
              <Terminal className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Interactive Sandbox & SDKs</div>
              <div className="text-xs text-slate-400">Python, Node, PHP, Go & cURL ready</div>
            </div>
          </div>
        </div>

        {/* Main Footer Navigation Columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-white/10">
          {/* Brand & Newsletter Column */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="inline-block">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0066FF] flex items-center justify-center shadow-lg shadow-blue-500/30 text-white font-black text-xl">
                  P
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-extrabold tracking-tight text-white font-mono">
                    PAY<span className="text-[#0066FF]">CORE</span>
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold -mt-1">
                    API Banking Engine
                  </span>
                </div>
              </div>
            </Link>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              High-performance payment orchestration infrastructure engineered for modern internet businesses, e-commerce, and high-volume platforms.
            </p>

            {/* Newsletter form with Glassmorphism */}
            <form onSubmit={handleNewsletter} className="pt-2 max-w-md">
              <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Subscribe to Developer API Changelog</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@company.com"
                  className="bg-white/10 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-full"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0066FF] hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shrink-0 transition shadow-md shadow-blue-500/30 cursor-pointer"
                >
                  Join
                </button>
              </div>
              {subscribed && (
                <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Subscribed to weekly release updates!</span>
                </div>
              )}
            </form>
          </div>

          {/* Column 1: Products */}
          <div className="space-y-3 text-xs">
            <div className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Products</div>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/#products" className="hover:text-blue-400 transition">Payment Gateway</Link></li>
              <li><Link to="/#products" className="hover:text-blue-400 transition">Instant Payouts</Link></li>
              <li><Link to="/#products" className="hover:text-blue-400 transition">UPI AutoPay 2.0</Link></li>
              <li><Link to="/#products" className="hover:text-blue-400 transition">Smart Payment Links</Link></li>
              <li><Link to="/#products" className="hover:text-blue-400 transition">GST Invoicing Engine</Link></li>
              <li><Link to="/#products" className="hover:text-blue-400 transition">Double-Entry Ledger</Link></li>
            </ul>
          </div>

          {/* Column 2: Developers */}
          <div className="space-y-3 text-xs">
            <div className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Developers</div>
            <ul className="space-y-2 text-slate-400">
              <li><Link to="/docs/api" className="hover:text-blue-400 transition flex items-center gap-1">REST API Docs <ExternalLink className="w-3 h-3" /></Link></li>
              <li><Link to="/dashboard/simulator" className="hover:text-blue-400 transition">Sandbox Simulator</Link></li>
              <li><Link to="/dashboard/api-keys" className="hover:text-blue-400 transition">API Key Manager</Link></li>
              <li><Link to="/dashboard/webhooks" className="hover:text-blue-400 transition">HMAC Webhooks</Link></li>
              <li><a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition flex items-center gap-1">Swagger OpenAPI <ExternalLink className="w-3 h-3" /></a></li>
            </ul>
          </div>

          {/* Column 3: Company & Security */}
          <div className="space-y-3 text-xs">
            <div className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Compliance & Trust</div>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-emerald-400" /> PCI-DSS Level 1</li>
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-blue-400" /> RBI PA-PG Ready</li>
              <li className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-amber-400" /> 99.99% Availability</li>
              <li><Link to="/login" className="hover:text-blue-400 transition">Merchant Portal</Link></li>
              <li><Link to="/register" className="hover:text-blue-400 transition">Create Account</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} PAYCORE Technologies Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
