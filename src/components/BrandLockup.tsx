import React from 'react';
import { BRAND_CONFIG } from '../config/brand';

interface BrandLockupProps {
  compact?: boolean;
  className?: string;
}

export const BrandLockup: React.FC<BrandLockupProps> = ({ compact = false, className = '' }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Emblem SVG */}
      <div className={`relative flex items-center justify-center shrink-0 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-950 border border-amber-400/40 shadow-sm ${compact ? 'w-9 h-9' : 'w-11 h-11'}`}>
        <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
          <circle cx="20" cy="20" r="14" stroke="#F2C14E" strokeWidth="1.5" strokeDasharray="3 1.5" />
          <polygon points="20,10 28,26 12,26" fill="none" stroke="#F2C14E" strokeWidth="1.5" />
          <polygon points="20,30 12,14 28,14" fill="none" stroke="#C9A227" strokeWidth="1.5" opacity="0.7" />
          <circle cx="20" cy="20" r="2.5" fill="#F2C14E" />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col text-right">
        <span className={`font-extrabold tracking-tight text-slate-900 dark:text-amber-100 leading-tight ${compact ? 'text-sm' : 'text-base'}`}>
          {BRAND_CONFIG.appTitle}
        </span>
        {!compact && (
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {BRAND_CONFIG.subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
