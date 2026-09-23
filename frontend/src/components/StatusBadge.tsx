import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalized = (status || '').toUpperCase();

  let colors = 'bg-slate-100 text-slate-700 border-slate-300 font-semibold';

  if (['SUCCEEDED', 'VERIFIED', 'PAID', 'SUCCESS', 'ACTIVE', 'HEALTHY', 'WON', 'COMPLETED'].includes(normalized)) {
    colors = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold';
  } else if (['FAILED', 'REJECTED', 'BLOCKED', 'CANCELLED', 'LOST', 'REVOKED'].includes(normalized)) {
    colors = 'bg-rose-50 text-rose-700 border-rose-300 font-semibold';
  } else if (['PROCESSING', 'UNDER_REVIEW', 'REQUIRES_CONFIRMATION', 'OPEN', 'RETRYING'].includes(normalized)) {
    colors = 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
  } else if (['REQUIRES_PAYMENT_METHOD', 'PROFILE_INCOMPLETE', 'CREATED', 'PENDING'].includes(normalized)) {
    colors = 'bg-blue-50 text-[#0066FF] border-blue-200 font-semibold';
  } else if (['REFUNDED', 'PARTIALLY_REFUNDED'].includes(normalized)) {
    colors = 'bg-purple-50 text-purple-700 border-purple-300 font-semibold';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75 animate-pulse" />
      {normalized.replace(/_/g, ' ')}
    </span>
  );
};
