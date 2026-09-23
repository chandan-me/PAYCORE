import React from 'react';

interface PageLoaderProps {
  text?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ text = 'Loading workspace...' }) => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-4 animate-fade-in">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0066FF] to-[#6851FF] p-[2px] shadow-lg shadow-blue-500/20 animate-pulse">
        <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs font-bold text-slate-700 tracking-wide">{text}</p>
        <p className="text-[10px] text-slate-400 font-mono">PAYCORE High-Speed Engine</p>
      </div>
    </div>
  );
};

