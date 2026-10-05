import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UI_STRINGS } from '../../content/ui.fa';
import { Button } from '../../components/Button';
import { toPersianDigits } from '../../utils/number';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export const BreakScreen: React.FC = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleContinue = () => {
    navigate('/section-b');
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center p-4 text-center select-none space-y-6">
      {/* Breathing Ring Animation */}
      <div className="relative flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-28 h-28 rounded-full bg-amber-400/20 dark:bg-amber-400/10 blur-md"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-lg border border-amber-300"
        >
          <Sparkles className="w-9 h-9" />
        </motion.div>
      </div>

      <div className="space-y-2 max-w-md">
        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
          {UI_STRINGS.break.badge}
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
          {UI_STRINGS.break.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {UI_STRINGS.break.description}
        </p>
      </div>

      <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 text-xs font-medium text-amber-900 dark:text-amber-200">
        {UI_STRINGS.break.progressNotice}
      </div>

      <div className="pt-4">
        <Button
          variant="primary"
          size="lg"
          onClick={handleContinue}
          leftIcon={<ArrowLeft className="w-5 h-5 rtl:rotate-180" />}
          className="min-w-[220px]"
        >
          <span>{UI_STRINGS.break.continueButton}</span>
          {countdown > 0 && (
            <span className="text-xs opacity-75 mr-1 font-mono">
              ({toPersianDigits(countdown)})
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};
