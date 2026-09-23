import React, { useState } from 'react';
import { ShieldCheck, Zap, TestTube, Check, X, AlertTriangle } from 'lucide-react';
import api from '../services/api';

interface ModeSelectorModalProps {
  isOpen: boolean;
  currentMode: 'TEST' | 'LIVE';
  onClose: () => void;
  onRefresh: () => void;
}

export const ModeSelectorModal: React.FC<ModeSelectorModalProps> = ({
  isOpen,
  currentMode,
  onClose,
  onRefresh
}) => {
  const [selectedMode, setSelectedMode] = useState<'TEST' | 'LIVE'>(currentMode);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSaveMode = async () => {
    setLoading(true);
    try {
      await api.post('/merchants/mode', { mode: selectedMode });
      onRefresh();
      onClose();
    } catch (err) {
      console.error('Failed to update environment mode:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 border border-slate-200 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <span className="text-[10px] font-mono text-[#0066FF] font-bold uppercase tracking-wider">
              Environment Configuration
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Select Operating Mode</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-600">
          Choose whether your merchant account operates in <strong>Sandbox Test Mode</strong> or <strong>Real Payments Mode</strong>. This choice is stored directly in your merchant ledger profile.
        </p>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Test Mode */}
          <div
            onClick={() => setSelectedMode('TEST')}
            className={`p-5 rounded-2xl cursor-pointer border transition-all ${
              selectedMode === 'TEST'
                ? 'bg-amber-50/80 border-amber-400 shadow-sm'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200">
                <TestTube className="w-5 h-5" />
              </div>
              {selectedMode === 'TEST' && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Sandbox Test Mode</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Safe testing environment. Process payments using simulated cards (<code className="text-amber-800 font-mono font-bold">4242</code>), mock UPI, and event triggers.
            </p>
          </div>

          {/* Real Mode */}
          <div
            onClick={() => setSelectedMode('LIVE')}
            className={`p-5 rounded-2xl cursor-pointer border transition-all ${
              selectedMode === 'LIVE'
                ? 'bg-emerald-50/80 border-emerald-400 shadow-sm'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <Zap className="w-5 h-5" />
              </div>
              {selectedMode === 'LIVE' && (
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Real Payments Mode</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Real-time payment orchestration. Routes live transactions to regulated acquiring provider adapters.
            </p>
          </div>
        </div>

        {selectedMode === 'LIVE' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Real payments require completed KYC verification in your onboarding profile.</span>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveMode}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{loading ? 'Saving to Database...' : 'Save & Persist Mode'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
