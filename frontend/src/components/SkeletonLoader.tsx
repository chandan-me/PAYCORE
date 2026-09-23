import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height
}) => {
  const variantClasses = {
    text: 'h-3.5 w-full rounded-md',
    rectangular: 'rounded-xl',
    circular: 'rounded-full'
  };

  const style: React.CSSProperties = {
    width: width,
    height: height
  };

  return (
    <div
      style={style}
      className={`relative overflow-hidden bg-slate-100/90 border border-slate-200/40 ${variantClasses[variant]} ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/80 to-transparent animate-[shimmer_1.6s_infinite]" />
    </div>
  );
};

export const LoginSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-[440px] bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/80 shadow-[0_20px_60px_rgba(0,102,255,0.06)] space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <Skeleton variant="rectangular" width={130} height={36} className="rounded-lg" />
        <Skeleton variant="rectangular" width={80} height={24} className="rounded-full" />
      </div>

      {/* Title & Subtitle */}
      <div className="space-y-2">
        <Skeleton variant="text" width="65%" height={24} />
        <Skeleton variant="text" width="90%" height={14} />
      </div>

      {/* Google OAuth Button Skeleton */}
      <Skeleton variant="rectangular" height={48} className="w-full rounded-2xl" />

      {/* Divider */}
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-[1px] bg-slate-200/60" />
        <Skeleton variant="text" width={30} height={12} />
        <div className="flex-1 h-[1px] bg-slate-200/60" />
      </div>

      {/* Form Fields Skeleton */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Skeleton variant="text" width={110} height={14} />
          <Skeleton variant="rectangular" height={44} className="w-full rounded-xl" />
        </div>

        <div className="space-y-1.5">
          <Skeleton variant="text" width={80} height={14} />
          <Skeleton variant="rectangular" height={44} className="w-full rounded-xl" />
        </div>
      </div>

      {/* CTA Button Skeleton */}
      <Skeleton variant="rectangular" height={48} className="w-full rounded-2xl bg-blue-100" />

      {/* Footer link skeleton */}
      <div className="flex justify-center pt-2">
        <Skeleton variant="text" width={180} height={14} />
      </div>
    </div>
  );
};
