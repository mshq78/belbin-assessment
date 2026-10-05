import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UI_STRINGS } from '../../content/ui.fa';
import { ROLE_CODES_LIST, ROLES_METADATA } from '../../config';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export const RevealScreen: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 2.5 second cinematic animation then navigate to /report
    const timer = setTimeout(() => {
      navigate('/report');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleSkip = () => {
    navigate('/report');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden text-amber-100">
      {/* Background Golden Orbital Lines */}
      <div className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border border-amber-500/20 border-dashed"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-6 rounded-full border border-amber-400/30"
        />
        <motion.div
          animate={{ scale: [0.9, 1.15, 0.9] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-36 h-36 rounded-full bg-amber-500/10 blur-xl"
        />

        {/* 9 Role Cards Converging to the Center */}
        {ROLE_CODES_LIST.map((code, idx) => {
          const angle = (idx * (360 / 9) * Math.PI) / 180;
          const initialDist = 130;
          const initialX = Math.cos(angle) * initialDist;
          const initialY = Math.sin(angle) * initialDist;

          return (
            <motion.div
              key={code}
              initial={{ x: initialX, y: initialY, scale: 0.6, opacity: 0 }}
              animate={{
                x: [initialX, 0],
                y: [initialY, 0],
                scale: [0.6, 1, 0.8],
                opacity: [0, 1, 0.8],
              }}
              transition={{
                duration: 2.1,
                ease: 'easeInOut',
                delay: idx * 0.05,
              }}
              className="absolute w-14 h-18 rounded-xl bg-gradient-to-br from-slate-900 to-slate-850 border border-amber-400/50 shadow-lg flex flex-col items-center justify-center p-1"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 mb-1" />
              <span className="text-[9px] font-bold text-amber-200">
                {ROLES_METADATA[code].persianTitle.split(' ')[0]}
              </span>
            </motion.div>
          );
        })}

        {/* Central Core Emblem */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.8, delay: 0.5, ease: 'backOut' }}
          className="relative z-10 w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-amber-300 to-amber-500 text-slate-950 flex items-center justify-center shadow-2xl border-2 border-amber-200"
        >
          <Sparkles className="w-10 h-10 animate-spin" style={{ animationDuration: '6s' }} />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="space-y-2 max-w-sm"
      >
        <h2 className="text-xl sm:text-2xl font-black text-amber-300">
          {UI_STRINGS.reveal.title}
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed font-medium">
          {UI_STRINGS.reveal.subtitle}
        </p>
      </motion.div>

      {/* Skip Button */}
      <button
        type="button"
        onClick={handleSkip}
        className="mt-8 text-xs text-amber-400/70 hover:text-amber-300 underline underline-offset-4 cursor-pointer transition"
      >
        {UI_STRINGS.reveal.skip}
      </button>
    </div>
  );
};
