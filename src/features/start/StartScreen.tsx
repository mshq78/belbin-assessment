import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessment } from '../../context/AssessmentContext';
import { UI_STRINGS } from '../../content/ui.fa';
import { Button } from '../../components/Button';
import { BrandLockup } from '../../components/BrandLockup';
import { toPersianDigits } from '../../utils/number';
import { auth, AuthUser } from '../../services/auth';
import { api } from '../../services/api';
import { SessionRecord } from '../../types';
import { LoginForm } from './LoginForm';
import {
  Sparkles,
  Clock,
  Shield,
  ArrowLeft,
  RotateCcw,
  LogOut,
  Users,
  Layers,
  Flame,
} from 'lucide-react';
import { motion } from 'motion/react';

export const StartScreen: React.FC = () => {
  const navigate = useNavigate();
  const { startAssessment, resumeAssessment, hasSavedProgress, showCompletedSession } = useAssessment();

  const [user, setUser] = useState<AuthUser | null>(auth.getUser());
  const [previousResult, setPreviousResult] = useState<SessionRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => auth.subscribe(setUser), []);

  const handleLoggedIn = (latest: SessionRecord | null) => {
    if (latest) {
      api.cacheSession(latest);
      setPreviousResult(latest);
    }
  };

  const handleStart = async () => {
    if (!user) return;
    setIsLoading(true);
    await startAssessment({ mobile: user.phone });
    setIsLoading(false);
    navigate('/section-a');
  };

  const handleViewPrevious = () => {
    if (!previousResult) return;
    showCompletedSession(previousResult);
    navigate('/report');
  };

  const handleLogout = () => {
    auth.logout();
    window.location.hash = '#/';
    window.location.reload();
  };

  const handleResume = async () => {
    setIsLoading(true);
    const targetRoute = await resumeAssessment();
    setIsLoading(false);
    navigate(targetRoute);
  };

  const renderAccount = () => (
    <>
      {!user ? (
        <LoginForm onLoggedIn={handleLoggedIn} />
      ) : (
        <div className="p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                {UI_STRINGS.login.welcome}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {UI_STRINGS.login.loggedInAs} <span dir="ltr">{toPersianDigits(user.phone)}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              {UI_STRINGS.login.logout}
            </button>
          </div>

          {previousResult && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
              <div>
                <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100">
                  {UI_STRINGS.login.previousResultTitle}
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
                  {UI_STRINGS.login.previousResultDesc}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleViewPrevious} className="w-full sm:w-auto">
                {UI_STRINGS.login.viewPreviousResult}
              </Button>
            </div>
          )}

          <p className="text-[10px] text-slate-400 leading-relaxed">{UI_STRINGS.start.privacyNote}</p>

          <Button
            variant="primary"
            size="lg"
            isLoading={isLoading}
            onClick={handleStart}
            className="w-full"
            leftIcon={<ArrowLeft className="w-5 h-5 rtl:rotate-180" />}
          >
            {UI_STRINGS.start.startButton}
          </Button>
        </div>
      )}
    </>
  );

  return (
    <div className="py-2 sm:py-6 space-y-6 sm:space-y-8 select-none">
      {/* Hero Presentation */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>{UI_STRINGS.start.badge}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
          {UI_STRINGS.start.title}
        </h1>

        <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 font-medium">
          {UI_STRINGS.start.frameworkNote}
        </p>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed pt-1">
          {UI_STRINGS.start.description}
        </p>
      </motion.div>

      {!user && renderAccount()}

      {/* Resume Banner if in-progress session exists */}
      {user && hasSavedProgress && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 sm:p-5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950 dark:text-amber-100"
        >
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{UI_STRINGS.start.resumeAlertTitle}</span>
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
              {UI_STRINGS.start.resumeAlertDesc}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleResume}
            className="whitespace-nowrap w-full sm:w-auto"
          >
            {UI_STRINGS.start.continueButton}
          </Button>
        </motion.div>
      )}

      {/* 2 Information Highlights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              {UI_STRINGS.start.timeEstimateTitle}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              {UI_STRINGS.start.timeEstimateDesc}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              {UI_STRINGS.start.natureTitle}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              {UI_STRINGS.start.natureDesc}
            </p>
          </div>
        </div>
      </div>

      {/* Assessment Steps Breakdown */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-2.5">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {UI_STRINGS.start.stepsOverviewTitle}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-slate-700 dark:text-slate-300 leading-snug">
              {UI_STRINGS.start.step1}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-slate-700 dark:text-slate-300 leading-snug">
              {UI_STRINGS.start.step2}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-slate-700 dark:text-slate-300 leading-snug">
              {UI_STRINGS.start.step3}
            </span>
          </div>
        </div>
      </div>

      {user && renderAccount()}
    </div>
  );
};
