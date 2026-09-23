import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  Users,
  AlertTriangle,
  FileText,
  Key,
  Webhook,
  Terminal,
  ShieldCheck,
  Building2,
  Sparkles,
  Link as LinkIcon,
  RefreshCw,
  ArrowUpRight,
  Scale,
  X
} from 'lucide-react';
import { PaycoreLogo } from './PaycoreLogo';

interface SidebarProps {
  role?: string;
  onboardingStep?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ role = 'MERCHANT_ADMIN', isOpen = false, onClose }) => {
  const isAdmin = role === 'PLATFORM_ADMIN';

  const merchantGroups = [
    {
      title: 'COLLECT PAYMENTS',
      links: [
        { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { to: '/dashboard/payments', label: 'Payment Gateway', icon: CreditCard },
        { to: '/dashboard/payment-links', label: 'Payment Links', icon: LinkIcon },
        { to: '/dashboard/invoices', label: 'GST Invoices', icon: FileText },
        { to: '/dashboard/checkout-sessions', label: 'Checkout Sessions', icon: Sparkles },
        { to: '/dashboard/customers', label: 'Customer Vault', icon: Users },
      ]
    },
    {
      title: 'DISBURSEMENTS & LEDGER',
      links: [
        { to: '/dashboard/payouts', label: 'Instant Payouts', icon: ArrowUpRight },
        { to: '/dashboard/transactions', label: 'Double-Entry Ledger', icon: Receipt },
      ]
    },
    {
      title: 'RECURRING & AUTOPAY',
      links: [
        { to: '/dashboard/subscriptions', label: 'UPI AutoPay Plans', icon: RefreshCw },
      ]
    },
    {
      title: 'RISK & COMPLIANCE',
      links: [
        { to: '/dashboard/disputes', label: 'Disputes & Shield', icon: AlertTriangle },
        { to: '/dashboard/onboarding', label: 'KYC & Onboarding', icon: Building2 },
      ]
    },
    {
      title: 'DEVELOPER SUITE',
      links: [
        { to: '/dashboard/api-keys', label: 'API Keys', icon: Key },
        { to: '/dashboard/webhooks', label: 'Webhooks & HMAC', icon: Webhook },
        { to: '/dashboard/simulator', label: 'Sandbox Simulator', icon: Terminal },
      ]
    }
  ];

  const adminGroups = [
    {
      title: 'PLATFORM OPERATIONS',
      links: [
        { to: '/admin', label: 'Platform Overview', icon: LayoutDashboard },
        { to: '/admin/disputes', label: 'Disputes Oversight', icon: AlertTriangle },
        { to: '/admin/payouts', label: 'Disbursals Queue', icon: ArrowUpRight },
      ]
    },
    {
      title: 'FINANCIAL INTEGRITY',
      links: [
        { to: '/admin/audit-logs', label: 'Append-Only Logs', icon: ShieldCheck },
        { to: '/admin/reconciliation', label: 'Ledger Reconciliation', icon: Scale },
      ]
    }
  ];

  const groups = isAdmin ? adminGroups : merchantGroups;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-30 w-64 bg-white border-r border-slate-200 flex flex-col h-screen select-none shadow-sm transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 bg-white">
          <PaycoreLogo size="sm" subtitle={isAdmin ? 'ADMIN CONSOLE' : 'MERCHANT CONSOLE'} />
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {groups.map((grp) => (
            <div key={grp.title} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">
                {grp.title}
              </div>
              {grp.links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === '/dashboard' || link.to === '/admin'}
                    onClick={() => onClose && onClose()}
                    className={({ isActive }: { isActive: boolean }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#0066FF] text-white shadow-md shadow-blue-600/20 font-bold'
                          : 'text-slate-600 hover:text-[#0066FF] hover:bg-slate-50'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0 opacity-90" />
                    <span className="truncate">{link.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer System Status */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/80">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[10px] font-bold text-slate-700">API Banking Live</span>
            </div>
            <span className="text-[10px] text-[#0066FF] font-mono font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              MYSQL 8.0
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};


