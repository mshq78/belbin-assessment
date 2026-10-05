import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessment } from '../../context/AssessmentContext';
import { UI_STRINGS } from '../../content/ui.fa';
import { Button } from '../../components/Button';
import { BrandLockup } from '../../components/BrandLockup';
import { validateIranMobile, normalizeToEnglishDigits } from '../../utils/number';
import {
  Sparkles,
  Clock,
  Shield,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Users,
  Layers,
  Flame,
} from 'lucide-react';
import { motion } from 'motion/react';

export const StartScreen: React.FC = () => {
  const navigate = useNavigate();
  const { startAssessment, resumeAssessment, hasSavedProgress } = useAssessment();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate mobile if entered
    if (mobile.trim() && !validateIranMobile(mobile)) {
      setMobileError(UI_STRINGS.start.mobileError);
      return;
    }
    setMobileError('');
    setIsLoading(true);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || undefined;

    await startAssessment({
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      mobile: normalizeToEnglishDigits(mobile.trim()) || undefined,
      orgCode: orgCode.trim() || undefined,
      fullName,
    });

    setIsLoading(false);
    navigate('/section-a');
  };

  const handleResume = async () => {
    setIsLoading(true);
    const targetRoute = await resumeAssessment();
    setIsLoading(false);
    navigate(targetRoute);
  };

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

      {/* Resume Banner if in-progress session exists */}
      {hasSavedProgress && (
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

      {/* Participant Form */}
      <form
        onSubmit={handleStart}
        className="p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-md space-y-4"
      >
        <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            {UI_STRINGS.start.formHeader}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="p-first-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {UI_STRINGS.start.firstName}
            </label>
            <input
              id="p-first-name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={UI_STRINGS.start.firstNamePlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label htmlFor="p-last-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {UI_STRINGS.start.lastName}
            </label>
            <input
              id="p-last-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={UI_STRINGS.start.lastNamePlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="p-mobile" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {UI_STRINGS.start.mobile}
            </label>
            <input
              id="p-mobile"
              type="tel"
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                if (mobileError) setMobileError('');
              }}
              placeholder={UI_STRINGS.start.mobilePlaceholder}
              dir="ltr"
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                mobileError
                  ? 'border-rose-400 focus:ring-rose-400'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-amber-400'
              }`}
            />
            {mobileError ? (
              <p className="text-[11px] text-rose-500 mt-1">{mobileError}</p>
            ) : (
              <p className="text-[10px] text-slate-400 mt-1">{UI_STRINGS.start.mobileHint}</p>
            )}
          </div>

          <div>
            <label htmlFor="p-org" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {UI_STRINGS.start.orgCode}
            </label>
            <input
              id="p-org"
              type="text"
              value={orgCode}
              onChange={(e) => setOrgCode(e.target.value)}
              placeholder={UI_STRINGS.start.orgCodePlaceholder}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {/* Privacy Note */}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
          {UI_STRINGS.start.privacyNote}
        </p>

        {/* Start Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full"
            leftIcon={<ArrowLeft className="w-5 h-5 rtl:rotate-180" />}
          >
            {UI_STRINGS.start.startButton}
          </Button>
        </div>
      </form>
    </div>
  );
};
