import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { UI_STRINGS } from '../../content/ui.fa';
import { ROLE_CODES_LIST, ROLES_METADATA } from '../../config';
import { toPersianDigits } from '../../utils/number';
import { useAssessment } from '../../context/AssessmentContext';

const REVEAL_MS = 15000;
const REVEAL_MS_REDUCED = 8000;

// Overall progress (0–1) at which each analysis step is finished
const STEP_ENDS = [0.14, 0.28, 0.42, 0.58, 0.72, 0.88, 1];

/** Slightly uneven pace so the progress feels like real work (quick starts, short pauses). */
const ease = (t: number) => {
  const smooth = t * t * (3 - 2 * t);
  return Math.min(1, 0.55 * t + 0.45 * smooth);
};

export const RevealScreen: React.FC = () => {
  const navigate = useNavigate();
  const { completedSession } = useAssessment();
  const steps = UI_STRINGS.reveal.steps;
  const [progress, setProgress] = useState(0); // 0–1
  const done = useRef(false);

  const duration = useMemo(
    () =>
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? REVEAL_MS_REDUCED
        : REVEAL_MS,
    []
  );

  useEffect(() => {
    // Opened directly (e.g. after a refresh) without a finished assessment in memory
    if (!completedSession) {
      navigate('/', { replace: true });
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setProgress(ease(t));
      if (t < 1) raf = requestAnimationFrame(tick);
      else if (!done.current) {
        done.current = true;
        setTimeout(() => navigate('/report', { replace: true }), 700);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [completedSession, duration, navigate]);

  const stepIndex = Math.min(steps.length - 1, STEP_ENDS.findIndex((end) => progress < end) === -1 ? steps.length - 1 : STEP_ENDS.findIndex((end) => progress < end));
  const percent = Math.round(progress * 100);
  const lockedRoles = Math.floor(Math.max(0, (progress - 0.58) / 0.3) * ROLE_CODES_LIST.length);

  const RADIUS = 92;
  const CIRC = 2 * Math.PI * RADIUS;

  const groups = [
    { label: UI_STRINGS.reveal.groupA, doneAt: STEP_ENDS[0] },
    { label: UI_STRINGS.reveal.groupB, doneAt: STEP_ENDS[1] },
    { label: UI_STRINGS.reveal.groupC, doneAt: STEP_ENDS[2] },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950 text-amber-100 flex flex-col items-center justify-center p-5 text-center select-none overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label={UI_STRINGS.reveal.title}
    >
      {/* Soft glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(242,193,78,0.10),transparent_60%)]" />

      {/* Orbit + progress ring */}
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center shrink-0">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border border-dashed border-amber-500/25"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-5 rounded-full border border-amber-400/20"
        />

        {/* Role chips orbiting; they "lock in" gold during the ranking step */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        >
          {ROLE_CODES_LIST.map((code, i) => {
            const angle = (i / ROLE_CODES_LIST.length) * Math.PI * 2;
            const locked = i < lockedRoles;
            return (
              <div
                key={code}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${50 + Math.cos(angle) * 47}%`, top: `${50 + Math.sin(angle) * 47}%` }}
              >
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                  className={`px-2 py-1 rounded-lg border text-[9px] sm:text-[10px] font-bold whitespace-nowrap transition-colors duration-700 ${
                    locked
                      ? 'bg-amber-400 text-slate-950 border-amber-200 shadow-[0_0_14px_rgba(242,193,78,0.6)]'
                      : 'bg-slate-900/80 text-amber-200/70 border-amber-500/25'
                  }`}
                >
                  {ROLES_METADATA[code].persianTitle}
                </motion.div>
              </div>
            );
          })}
        </motion.div>

        {/* Progress ring */}
        <svg className="relative z-10 w-52 h-52 sm:w-56 sm:h-56 -rotate-90" viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="rgba(242,193,78,0.12)" strokeWidth="6" />
          <circle
            cx="100"
            cy="100"
            r={RADIUS}
            fill="none"
            stroke="url(#revealGold)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - progress)}
          />
          <defs>
            <linearGradient id="revealGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F2C14E" />
              <stop offset="100%" stopColor="#FDE9A8" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute z-20 flex flex-col items-center">
          <Sparkles className="w-6 h-6 text-amber-300 mb-1 animate-pulse" />
          <span className="text-4xl sm:text-5xl font-black text-amber-300 tabular-nums leading-none">
            {toPersianDigits(percent)}
            <span className="text-xl">٪</span>
          </span>
        </div>
      </div>

      {/* Title + current step */}
      <div className="mt-5 space-y-1 max-w-sm">
        <h2 className="text-lg sm:text-2xl font-black text-amber-300">{UI_STRINGS.reveal.title}</h2>
        <div className="h-6 relative">
          <AnimatePresence mode="wait">
            <motion.p
              key={stepIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-x-0 text-xs sm:text-sm text-amber-100/80 font-medium"
            >
              {steps[stepIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Data sources being analysed */}
      <div className="mt-5 grid grid-cols-3 gap-2 w-full max-w-sm">
        {groups.map((g) => {
          const finished = progress >= g.doneAt;
          return (
            <div
              key={g.label}
              className={`rounded-2xl border px-2 py-2.5 text-[10px] sm:text-xs font-medium leading-snug flex flex-col items-center gap-1.5 transition-colors duration-500 ${
                finished ? 'border-amber-400/50 bg-amber-400/10 text-amber-200' : 'border-slate-700/70 bg-slate-900/60 text-slate-400'
              }`}
            >
              {finished ? <Check className="w-4 h-4 text-amber-300" /> : <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
              <span>{g.label}</span>
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-[11px] text-slate-500 max-w-xs leading-relaxed">{UI_STRINGS.reveal.subtitle}</p>
    </div>
  );
};
