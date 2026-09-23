import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, Code, Zap, TestTube, Settings2, ArrowUpRight, Menu, Home } from 'lucide-react';
import { ModeSelectorModal } from './ModeSelectorModal';

interface NavbarProps {
  user: any;
  merchant: any;
  onLogout: () => void;
  onRefreshMerchant: () => void;
  onOpenCommandPalette?: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  merchant,
  onLogout,
  onRefreshMerchant,
  onOpenCommandPalette,
  onToggleMobileSidebar
}) => {
  const navigate = useNavigate();
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);

  const isLive = merchant?.environment_mode === 'LIVE';

  return (
    <>
      <header className="h-16 bg-white/95 border-b border-slate-200/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-all shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)]">
        {/* Left: Mobile Menu Toggle & Global Command Search */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-[#0066FF]/50 text-slate-500 text-xs hover:text-slate-900 transition-all group shadow-2xs hover:shadow-xs cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0066FF] transition-colors" />
            <span className="font-medium hidden sm:inline text-slate-600 group-hover:text-slate-900">
              Search payments, customers, UTRs...
            </span>
            <span className="font-medium sm:hidden">Search...</span>
            <kbd className="ml-2 sm:ml-3 px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-400 font-mono shadow-2xs group-hover:border-[#0066FF]/30 group-hover:text-[#0066FF]">
              Ctrl K
            </kbd>
          </button>

          {/* System Latency Pulse (Desktop) */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/70 text-[10px] font-mono text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>UPI Rail: <strong className="text-emerald-700 font-bold">142ms</strong></span>
          </div>
        </div>

        {/* Right: Balance Chip, Environment Switcher, Home, API Reference & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Home Link */}
          <button
            onClick={() => navigate('/')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-xs text-slate-700 hover:text-[#0066FF] font-semibold transition-all cursor-pointer shadow-2xs"
            title="Go to Public Landing Page"
          >
            <Home className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#0066FF]" />
            <span>Home</span>
          </button>

          {/* Quick Payout / Balance Chip */}
          <button
            onClick={() => navigate('/dashboard/payouts')}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200/90 text-xs hover:border-[#0066FF] hover:shadow-xs transition-all text-slate-700 hover:text-[#0066FF] cursor-pointer"
            title="Instant Payout Balance"
          >
            <span className="w-2 h-2 rounded-full bg-[#00D284] animate-pulse" />
            <span className="text-[11px] text-slate-500 font-medium">Payouts Bal:</span>
            <span className="font-mono font-bold text-slate-900">₹ Instant</span>
            <ArrowUpRight className="w-3 h-3 text-[#0066FF]" />
          </button>

          {/* Environment Mode Pill */}
          {merchant && (
            <button
              onClick={() => setIsModeModalOpen(true)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all border shadow-2xs cursor-pointer ${
                isLive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 hover:border-amber-400'
              }`}
            >
              {isLive ? <Zap className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> : <TestTube className="w-3.5 h-3.5 text-amber-600" />}
              <span>{isLive ? 'LIVE' : 'TEST'}</span>
              <Settings2 className="w-3.5 h-3.5 ml-0.5 opacity-60 hover:opacity-100" />
            </button>
          )}

          {/* API Reference Link */}
          <button
            onClick={() => navigate('/docs/api')}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-xs text-slate-700 hover:text-[#0066FF] font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <Code className="w-3.5 h-3.5 text-[#0066FF]" />
            <span>API Docs</span>
          </button>

          {/* User / Merchant Profile & Logout */}
          <div className="flex items-center gap-2.5 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200">
            {/* Avatar Circle with Initials */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#6851FF] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              {(user?.full_name || merchant?.business_name || 'M').charAt(0).toUpperCase()}
            </div>

            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {user?.full_name || 'Merchant Admin'}
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[120px] font-mono">
                {merchant?.business_name || user?.email}
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mode Selector Modal */}
      {merchant && (
        <ModeSelectorModal
          isOpen={isModeModalOpen}
          currentMode={merchant.environment_mode}
          onClose={() => setIsModeModalOpen(false)}
          onRefresh={onRefreshMerchant}
        />
      )}
    </>
  );
};
