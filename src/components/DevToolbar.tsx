import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, ChevronUp, ChevronDown, Wand2, WifiOff, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useAssessment } from '../context/AssessmentContext';

export const DevToolbar: React.FC = () => {
  if (!import.meta.env.DEV) return null;

  const [isOpen, setIsOpen] = useState(false);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const navigate = useNavigate();
  const { autoFillAllAnswers, resetAll } = useAssessment();

  const handleToggleOffline = () => {
    const next = !isSimulatedOffline;
    setIsSimulatedOffline(next);
    api.setSimulatedOffline(next);
  };

  const routes = [
    { label: 'شروع', path: '/' },
    { label: 'بخش A', path: '/section-a' },
    { label: 'استراحت', path: '/break' },
    { label: 'بخش B', path: '/section-b' },
    { label: 'بخش C', path: '/section-c' },
    { label: 'بررسی', path: '/review' },
    { label: 'آشکارسازی', path: '/reveal' },
    { label: 'گزارش', path: '/report' },
    { label: 'مدیر', path: '/admin' },
  ];

  return (
    <div className="fixed bottom-3 left-3 z-50 select-none text-xs" dir="rtl">
      {/* Floating Toggle Pill */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="px-3 py-1.5 rounded-full bg-slate-900/90 text-amber-300 border border-amber-400/40 shadow-lg backdrop-blur-xs flex items-center gap-1.5 cursor-pointer hover:bg-slate-800 transition"
      >
        <Wrench className="w-3.5 h-3.5 text-amber-400" />
        <span className="font-bold">DevTools</span>
        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>

      {/* Expanded Panel */}
      {isOpen && (
        <div className="mt-2 p-3 bg-slate-900/95 text-slate-200 border border-slate-700 rounded-2xl shadow-2xl backdrop-blur-md w-72 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
            <span className="font-bold text-amber-300">جعبه‌ابزار توسعه (فقط DEV)</span>
            <span className="text-[10px] text-slate-400 font-mono">v1.0</span>
          </div>

          {/* Jump to steps */}
          <div>
            <div className="text-[11px] text-slate-400 mb-1">پرش مستقیم به مرحله:</div>
            <div className="grid grid-cols-3 gap-1">
              {routes.map((r) => (
                <button
                  key={r.path}
                  type="button"
                  onClick={() => {
                    navigate(r.path);
                    setIsOpen(false);
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-300 font-medium transition cursor-pointer text-center text-[10px]"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-1 pt-1 border-t border-slate-800">
            <button
              type="button"
              onClick={async () => {
                await autoFillAllAnswers();
                navigate('/report');
                setIsOpen(false);
              }}
              className="w-full px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 flex items-center gap-2 font-medium transition cursor-pointer text-[11px]"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-400" />
              <span>تکمیل خودکار هوشمند و پرش به گزارش</span>
            </button>

            <button
              type="button"
              onClick={handleToggleOffline}
              className={`w-full px-2.5 py-1.5 rounded-xl flex items-center gap-2 font-medium transition cursor-pointer text-[11px] ${
                isSimulatedOffline
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span>{isSimulatedOffline ? 'شبیه‌سازی آفلاین (فعال)' : 'شبیه‌سازی حالت آفلاین'}</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                await resetAll();
                navigate('/');
                setIsOpen(false);
              }}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-300 hover:bg-slate-700 flex items-center gap-2 font-medium transition cursor-pointer text-[11px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>پاک‌سازی کامل ذخیره محلی</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
