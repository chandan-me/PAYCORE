import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CreditCard, Receipt, Key, Webhook, Terminal, BookOpen, X } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = [
    { label: 'View All Payments', icon: CreditCard, path: '/dashboard/payments' },
    { label: 'Explore Transactions & Ledger', icon: Receipt, path: '/dashboard/transactions' },
    { label: 'Manage API Keys', icon: Key, path: '/dashboard/api-keys' },
    { label: 'Manage Webhooks', icon: Webhook, path: '/dashboard/webhooks' },
    { label: 'Open Developer Simulator', icon: Terminal, path: '/dashboard/simulator' },
    { label: 'Read Developer API Documentation', icon: BookOpen, path: '/docs/api' },
  ];

  const filtered = items.filter(i => i.label.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 gap-3">
          <Search className="w-4 h-4 text-[#0066FF]" />
          <input
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
          />
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">No matching commands found.</div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(item.path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-blue-50 hover:text-[#0066FF] font-medium text-left transition-colors cursor-pointer"
                >
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-[#0066FF]" />
                  <span>{item.label}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
