import React, { useState } from 'react';
import { X, UserPlus, ArrowRight } from 'lucide-react';

interface GoogleAccount {
  name: string;
  email: string;
  avatarText: string;
  avatarBg: string;
}

interface GoogleAccountChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (account: { name: string; email: string; google_token?: string }) => void;
}

export const GoogleAccountChooserModal: React.FC<GoogleAccountChooserModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  if (!isOpen) return null;

  const sampleAccounts: GoogleAccount[] = [
    {
      name: 'Chandan N',
      email: 'chandan2004.n@gmail.com',
      avatarText: 'CN',
      avatarBg: 'bg-emerald-600'
    },
    {
      name: 'majorproject',
      email: 'majorproject.chandan@gmail.com',
      avatarText: 'm',
      avatarBg: 'bg-orange-600'
    },
    {
      name: 'NVC Family',
      email: 'nvc.family.nvc@gmail.com',
      avatarText: 'N',
      avatarBg: 'bg-amber-600'
    },
    {
      name: 'development.chandan',
      email: 'development.chandan@gmail.com',
      avatarText: 'd',
      avatarBg: 'bg-yellow-600'
    }
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    onSelectAccount({
      name: customName || customEmail.split('@')[0],
      email: customEmail
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1a1b1e] text-slate-100 rounded-xl border border-slate-700/80 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#121316] px-4 py-2 flex items-center justify-between border-b border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.27v3.15C3.25 21.3 7.31 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l4.01-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.61l4.01 3.15c.95-2.85 3.6-4.96 6.72-4.96z"/>
            </svg>
            <span className="font-medium text-slate-300">Sign in - Google Accounts</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.27v3.15C3.25 21.3 7.31 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l4.01-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.61l4.01 3.15c.95-2.85 3.6-4.96 6.72-4.96z"/>
            </svg>
            <span className="text-xs font-semibold text-slate-300">Sign in with Google</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white tracking-tight">Choose an account</h2>
            <p className="text-xs text-slate-400">
              to continue to <strong className="text-indigo-400 font-medium">paycore.io</strong>
            </p>
          </div>

          {!showCustomInput ? (
            <div className="divide-y divide-slate-800 border-t border-b border-slate-800">
              {sampleAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => onSelectAccount({ name: acc.name, email: acc.email })}
                  className="w-full py-3.5 px-2 flex items-center gap-3.5 text-left hover:bg-slate-800/60 transition-colors group"
                >
                  <div className={`w-9 h-9 rounded-full ${acc.avatarBg} text-white flex items-center justify-center font-bold text-xs shadow-inner shrink-0`}>
                    {acc.avatarText}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                      {acc.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{acc.email}</div>
                  </div>
                </button>
              ))}

              <button
                onClick={() => setShowCustomInput(true)}
                className="w-full py-3.5 px-2 flex items-center gap-3.5 text-left hover:bg-slate-800/60 transition-colors text-xs text-slate-300 font-medium"
              >
                <div className="w-9 h-9 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span>Use another account</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">Google Email Address</label>
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full bg-[#121316] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="your.email@gmail.com"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">Full Name (Optional)</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-[#121316] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Your Name"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomInput(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ← Back to account list
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
