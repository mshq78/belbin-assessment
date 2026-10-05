import React from 'react';
import { toPersianDigits } from '../utils/number';

interface ProgressRuleProps {
  currentStepIndex: number; // 0..29
  totalSteps?: number; // default 30
  className?: string;
}

export const ProgressRule: React.FC<ProgressRuleProps> = ({
  currentStepIndex,
  totalSteps = 30,
  className = '',
}) => {
  const percent = Math.min(
    100,
    Math.max(1, Math.round(((currentStepIndex + 1) / totalSteps) * 100))
  );

  return (
    <div className={`w-full py-2.5 px-4 select-none ${className}`}>
      <div className="max-w-[720px] mx-auto flex items-center gap-3">
        {/* Progress Track */}
        <div className="flex-1 h-2 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-300/40 dark:border-slate-700/60 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-500 rounded-full transition-all duration-300 ease-out shadow-xs"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Persian Percent Indicator Only */}
        <div className="text-xs font-bold text-amber-700 dark:text-amber-300 tabular-nums min-w-[2.75rem] text-left">
          {toPersianDigits(percent)}٪
        </div>
      </div>
    </div>
  );
};
