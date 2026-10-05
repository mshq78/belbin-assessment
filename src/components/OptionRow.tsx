import React from 'react';
import { motion } from 'motion/react';

interface OptionRowProps {
  text: string;
  badgeContent?: React.ReactNode;
  isSelected?: boolean;
  isSecondarySelected?: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export const OptionRow: React.FC<OptionRowProps> = ({
  text,
  badgeContent,
  isSelected = false,
  isSecondarySelected = false,
  onClick,
  disabled = false,
  className = '',
  ariaLabel,
}) => {
  return (
    <motion.button
      type="button"
      whileHover={!disabled ? { scale: 1.005 } : undefined}
      whileTap={!disabled ? { scale: 0.995 } : undefined}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || text}
      className={`w-full text-right p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 cursor-pointer min-h-[56px] select-none text-slate-800 dark:text-slate-100 ${
        isSelected
          ? 'bg-amber-500/15 dark:bg-amber-400/20 border-amber-500 dark:border-amber-400 shadow-sm ring-1 ring-amber-500/30'
          : isSecondarySelected
          ? 'bg-slate-200/70 dark:bg-slate-800/90 border-slate-400 dark:border-slate-600 shadow-xs'
          : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/90 dark:border-slate-800 hover:border-amber-400/50 hover:bg-amber-50/30 dark:hover:bg-slate-800/50 shadow-xs'
      } ${className}`}
    >
      {/* Badge Indicator */}
      {badgeContent !== undefined && (
        <div
          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors ${
            isSelected
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : isSecondarySelected
              ? 'bg-slate-700 text-white dark:bg-slate-700'
              : 'border border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500'
          }`}
        >
          {badgeContent}
        </div>
      )}

      {/* Text Context */}
      <div className="flex-1 text-sm sm:text-base leading-relaxed font-medium">
        {text}
      </div>
    </motion.button>
  );
};
