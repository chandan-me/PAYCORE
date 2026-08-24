import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalized = (status || '').toUpperCase();

  let colors = 'bg-slate-800 text-slate-300 border-slate-700';

  if (['SUCCEEDED', 'VERIFIED', 'PAID', 'SUCCESS', 'ACTIVE', 'HEALTHY', 'WON', 'COMPLETED'].includes(normalized)) {
    colors = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50';
  } else if (['FAILED', 'REJECTED', 'BLOCKED', 'CANCELLED', 'LOST', 'REVOKED'].includes(normalized)) {
    colors = 'bg-rose-950/60 text-rose-400 border-rose-800/50';
  } else if (['PROCESSING', 'UNDER_REVIEW', 'REQUIRES_CONFIRMATION', 'OPEN', 'RETRYING'].includes(normalized)) {
    colors = 'bg-amber-950/60 text-amber-400 border-amber-800/50';
  } else if (['REQUIRES_PAYMENT_METHOD', 'PROFILE_INCOMPLETE', 'CREATED', 'PENDING'].includes(normalized)) {
    colors = 'bg-indigo-950/60 text-indigo-400 border-indigo-800/50';
  } else if (['REFUNDED', 'PARTIALLY_REFUNDED'].includes(normalized)) {
    colors = 'bg-purple-950/60 text-purple-400 border-purple-800/50';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75 animate-pulse" />
      {normalized.replace(/_/g, ' ')}
    </span>
  );
};
