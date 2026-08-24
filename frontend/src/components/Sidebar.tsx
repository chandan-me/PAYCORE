import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  Users,
  Wallet,
  RotateCcw,
  AlertTriangle,
  FileText,
  Key,
  Webhook,
  Terminal,
  ShieldCheck,
  Building2,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  role?: string;
  onboardingStep?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ role = 'MERCHANT_ADMIN' }) => {
  const isAdmin = role === 'PLATFORM_ADMIN';

  const merchantLinks = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/dashboard/payments', label: 'Payments', icon: CreditCard },
    { to: '/dashboard/transactions', label: 'Transactions & Ledger', icon: Receipt },
    { to: '/dashboard/customers', label: 'Customers', icon: Users },
    { to: '/dashboard/balances', label: 'Balances', icon: Wallet },
    { to: '/dashboard/refunds', label: 'Refunds', icon: RotateCcw },
    { to: '/dashboard/disputes', label: 'Disputes', icon: AlertTriangle },
    { to: '/dashboard/invoices', label: 'Invoices', icon: FileText },
    { to: '/dashboard/checkout-sessions', label: 'Hosted Checkout', icon: Sparkles },
    { to: '/dashboard/api-keys', label: 'API Keys', icon: Key },
    { to: '/dashboard/webhooks', label: 'Webhooks', icon: Webhook },
    { to: '/dashboard/simulator', label: 'Developer Simulator', icon: Terminal },
    { to: '/dashboard/onboarding', label: 'Onboarding Wizard', icon: Building2 },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Platform Overview', icon: LayoutDashboard },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldCheck },
    { to: '/admin/reconciliation', label: 'Reconciliation', icon: Receipt },
  ];

  const links = isAdmin ? adminLinks : merchantLinks;

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-indigo-500/30">
          P
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            PAYCORE
          </span>
          <span className="text-[10px] block font-mono text-indigo-400 -mt-1 font-semibold uppercase tracking-wider">
            {isAdmin ? 'PLATFORM ADMIN' : 'ORCHESTRATION'}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {isAdmin ? 'Platform Management' : 'Merchant Dashboard'}
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/dashboard' || link.to === '/admin'}
              className={({ isActive }: { isActive: boolean }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 opacity-80" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono text-[11px] font-semibold">SANDBOX PROVIDER</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
