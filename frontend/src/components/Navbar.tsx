import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, Code, Zap, TestTube, Settings2 } from 'lucide-react';
import { ModeSelectorModal } from './ModeSelectorModal';

interface NavbarProps {
  user: any;
  merchant: any;
  onLogout: () => void;
  onRefreshMerchant: () => void;
  onOpenCommandPalette?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  merchant,
  onLogout,
  onRefreshMerchant,
  onOpenCommandPalette
}) => {
  const navigate = useNavigate();
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);

  const isLive = merchant?.environment_mode === 'LIVE';

  return (
    <>
      <header className="h-16 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-400 text-xs hover:text-slate-200 transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search or command...</span>
            <kbd className="ml-4 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-400 font-mono">
              Ctrl K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-4">
          {merchant && (
            <button
              onClick={() => setIsModeModalOpen(true)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all border shadow-lg ${
                isLive
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/60 hover:bg-emerald-900 shadow-emerald-500/10'
                  : 'bg-amber-950/80 text-amber-400 border-amber-500/60 hover:bg-amber-900 shadow-amber-500/10'
              }`}
            >
              {isLive ? <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> : <TestTube className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isLive ? 'REAL PAYMENTS MODE' : 'SANDBOX TEST MODE'}</span>
              <Settings2 className="w-3.5 h-3.5 ml-1 opacity-70" />
            </button>
          )}

          <button
            onClick={() => navigate('/docs/api')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 font-medium transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
            <span>API Reference</span>
          </button>

          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <div className="text-right">
              <div className="text-xs font-medium text-slate-200">{user?.full_name || 'User'}</div>
              <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{merchant?.business_name || user?.email}</div>
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all"
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
