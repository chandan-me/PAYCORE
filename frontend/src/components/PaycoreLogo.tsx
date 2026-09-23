import React from 'react';

interface PaycoreLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

export const PaycoreLogo: React.FC<PaycoreLogoProps> = ({
  size = 'md',
  showText = true,
  subtitle,
  className = ''
}) => {
  const iconSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-base',
    lg: 'w-11 h-11 text-xl',
    xl: 'w-14 h-14 text-2xl'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Vector Icon */}
      <div className={`${iconSizes[size]} rounded-2xl bg-gradient-to-tr from-[#0066FF] via-blue-600 to-[#6851FF] p-[2px] shadow-md shadow-blue-500/25 relative flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-105`}>
        <svg viewBox="0 0 100 100" className="w-full h-full rounded-2xl" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoInner" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0066FF" />
              <stop offset="100%" stopColor="#6851FF" />
            </linearGradient>
            <linearGradient id="logoSpark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00D284" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="100" height="100" rx="28" fill="url(#logoInner)" />
          <path d="M 32 72 L 32 28 L 54 28 C 66 28 73 34 73 44 C 73 54 66 60 54 60 L 44 60 L 44 72 Z" fill="#FFFFFF" />
          <path d="M 44 39 L 52 39 C 58 39 62 41 62 44 C 62 47 58 49 52 49 L 44 49 Z" fill="url(#logoInner)" />
          <circle cx="68" cy="30" r="7.5" fill="url(#logoSpark)" />
          <circle cx="68" cy="30" r="3.5" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight text-slate-900 ${textSizes[size]}`}>
              PAYCORE
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-[#0066FF] border border-blue-200 font-mono font-bold">
              CF
            </span>
          </div>
          {subtitle && (
            <span className="text-[9px] font-mono text-slate-400 -mt-0.5 font-bold tracking-wider uppercase">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
