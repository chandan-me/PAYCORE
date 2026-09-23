import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
  Copy,
  Check,
  Zap,
  CreditCard
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'payment';

export interface ToastOptions {
  title: string;
  message?: string;
  duration?: number;
  copyableText?: string;
  paymentDetails?: {
    amount: number; // in minor units (e.g. 249900 = ₹2,499.00)
    currency?: string;
    status?: string;
    utr?: string;
    method?: string;
  };
}

export interface ToastItem extends ToastOptions {
  id: string;
  type: ToastType;
  createdAt: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (type: ToastType, options: ToastOptions) => string;
  removeToast: (id: string) => void;
  success: (title: string, message?: string, copyableText?: string, duration?: number) => string;
  error: (title: string, message?: string, copyableText?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
  payment: (details: ToastOptions['paymentDetails'] & { title?: string; message?: string }) => string;
  copied: (text: string, label?: string) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, options: ToastOptions) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const duration = options.duration ?? (type === 'error' ? 6000 : 4500);

    const newToast: ToastItem = {
      ...options,
      id,
      type,
      createdAt: Date.now()
    };

    setToasts(prev => [newToast, ...prev.slice(0, 4)]); // Keep max 5 visible

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const success = useCallback((title: string, message?: string, copyableText?: string, duration?: number) => {
    return addToast('success', { title, message, copyableText, duration });
  }, [addToast]);

  const error = useCallback((title: string, message?: string, copyableText?: string, duration?: number) => {
    return addToast('error', { title, message, copyableText, duration });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    return addToast('warning', { title, message, duration });
  }, [addToast]);

  const info = useCallback((title: string, message?: string, duration?: number) => {
    return addToast('info', { title, message, duration });
  }, [addToast]);

  const payment = useCallback((details: ToastOptions['paymentDetails'] & { title?: string; message?: string }) => {
    return addToast('payment', {
      title: details.title || 'Payment Processed Successfully',
      message: details.message,
      paymentDetails: details,
      duration: 6000
    });
  }, [addToast]);

  const copied = useCallback((text: string, label = 'Copied to clipboard') => {
    return addToast('info', {
      title: label,
      message: text.length > 35 ? `${text.substring(0, 32)}...` : text,
      copyableText: text,
      duration: 2500
    });
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
        payment,
        copied
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast Container & Individual Card Component
const ToastContainer: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map(toast => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{
  toast: ToastItem;
  onDismiss: () => void;
}> = ({ toast, onDismiss }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (toast.copyableText) {
      navigator.clipboard.writeText(toast.copyableText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAmount = (minorUnits: number, currency = 'INR') => {
    const symbol = currency === 'INR' ? '₹' : '$';
    return `${symbol}${(minorUnits / 100).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const getThemeConfig = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          border: 'border-emerald-200/90 shadow-emerald-600/10',
          accent: 'bg-emerald-500',
          pillBg: 'bg-emerald-50 text-emerald-800 border-emerald-200'
        };
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          border: 'border-rose-200/90 shadow-rose-600/10',
          accent: 'bg-rose-500',
          pillBg: 'bg-rose-50 text-rose-800 border-rose-200'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          border: 'border-amber-200/90 shadow-amber-600/10',
          accent: 'bg-amber-500',
          pillBg: 'bg-amber-50 text-amber-800 border-amber-200'
        };
      case 'payment':
        return {
          icon: <Zap className="w-5 h-5 text-[#0066FF] shrink-0 animate-pulse" />,
          border: 'border-blue-200 shadow-blue-600/15 ring-1 ring-blue-500/10',
          accent: 'bg-[#0066FF]',
          pillBg: 'bg-blue-50 text-[#0066FF] border-blue-200'
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5 text-[#0066FF] shrink-0" />,
          border: 'border-blue-200/90 shadow-blue-600/10',
          accent: 'bg-[#0066FF]',
          pillBg: 'bg-blue-50 text-[#0066FF] border-blue-200'
        };
    }
  };

  const config = getThemeConfig();

  return (
    <div
      role="alert"
      className={`pointer-events-auto w-full bg-white/95 backdrop-blur-xl border ${config.border} rounded-2xl shadow-xl p-4 transition-all duration-300 transform hover:scale-[1.01] animate-fade-in-up relative overflow-hidden group`}
    >
      {/* Top Left Accent Bar */}
      <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${config.accent}`} />

      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-0.5">{config.icon}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug truncate">
                {toast.title}
              </h4>
              {toast.type === 'payment' && toast.paymentDetails?.status && (
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                  {toast.paymentDetails.status}
                </span>
              )}
            </div>

            {toast.message && (
              <p className="text-xs text-slate-600 mt-1 leading-relaxed break-words">
                {toast.message}
              </p>
            )}

            {/* Special Fintech Payment Card Breakdown */}
            {toast.type === 'payment' && toast.paymentDetails && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-500" />
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">
                      {toast.paymentDetails.method || 'UPI / Instant Collect'}
                    </span>
                    <span className="text-xs font-mono text-slate-600 font-medium">
                      UTR: {toast.paymentDetails.utr || 'PROCESSED'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs sm:text-sm font-black text-slate-900 font-mono">
                    {formatAmount(toast.paymentDetails.amount, toast.paymentDetails.currency)}
                  </div>
                </div>
              </div>
            )}

            {/* Copyable text button */}
            {toast.copyableText && (
              <button
                onClick={handleCopy}
                className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono transition-colors cursor-pointer border border-slate-200"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                <span>{copied ? 'Copied!' : 'Copy Reference'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Dismiss X Button */}
        <button
          onClick={onDismiss}
          aria-label="Close notification"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
