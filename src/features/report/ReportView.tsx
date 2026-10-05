import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessment } from '../../context/AssessmentContext';
import { ROLE_CONTENT_MAP } from '../../roleContent';
import { UI_STRINGS } from '../../content/ui.fa';
import { toPersianDigits, formatScore } from '../../utils/number';
import { RadarChart } from '../../components/RadarChart';
import { Button } from '../../components/Button';
import { Collapsible } from '../../components/Collapsible';
import { toPng } from 'html-to-image';
import {
  Printer,
  Image as ImageIcon,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  BarChart2,
  PieChart,
  Lightbulb,
  Eye,
  AlertCircle,
  Compass,
  Repeat,
  Share2,
} from 'lucide-react';
import { motion } from 'motion/react';

export const ReportView: React.FC = () => {
  const navigate = useNavigate();
  const { completedSession, resetAll } = useAssessment();
  const reportRef = useRef<HTMLDivElement>(null);

  const [chartMode, setChartMode] = useState<'bar' | 'radar'>('bar');
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [isCopying, setIsCopying] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);

  if (!completedSession) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-sm text-slate-500">جلسه ارزیابی یافت نشد یا ارزیابی هنوز تکمیل نشده است.</p>
        <Button variant="primary" onClick={() => navigate('/')}>
          {UI_STRINGS.common.restart}
        </Button>
      </div>
    );
  }

  const { scoring, participantName, trackingCode, finishedAt } = completedSession;
  const { roles, top3 } = scoring;

  const toggleFlip = (code: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyTracking = async () => {
    setIsCopying(true);
    const text = `کد پیگیری ارزیابی بلبین: ${trackingCode}\nلینک ارزیابی: ${window.location.origin}`;
    try {
      await navigator.clipboard.writeText(text);
      setTimeout(() => setIsCopying(false), 2000);
    } catch (e) {
      setIsCopying(false);
    }
  };

  const handleExportImage = async () => {
    if (!reportRef.current) return;
    setIsExportingImage(true);
    try {
      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#08121D' : '#F8F5EE',
      });
      const link = document.createElement('a');
      link.download = `belbin_report_${trackingCode || 'result'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export report image', err);
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleRestart = async () => {
    await resetAll();
    navigate('/');
  };

  const formattedDate = new Date(finishedAt).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div ref={reportRef} className="space-y-8 select-none print:p-0 print:space-y-6">
      {/* Top Meta & Action Bar */}
      <header className="p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{UI_STRINGS.report.tag}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              {UI_STRINGS.report.title}
              {participantName && (
                <span className="block sm:inline font-normal text-slate-600 dark:text-slate-400 text-base sm:text-lg sm:mr-2">
                  ({UI_STRINGS.report.participantPrefix} {participantName})
                </span>
              )}
            </h1>
          </div>

          {/* Tracking Code Badge */}
          <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-slate-800/80 border border-amber-300/60 dark:border-slate-700 text-right self-start sm:self-auto">
            <span className="text-[10px] text-slate-400 block">{UI_STRINGS.report.trackingCodeLabel}</span>
            <span className="text-sm font-black text-amber-900 dark:text-amber-300 font-mono">
              {trackingCode}
            </span>
          </div>
        </div>

        {/* Action Buttons for Screen View */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs no-print">
          <span className="text-slate-500 dark:text-slate-400">
            {UI_STRINGS.report.dateLabel} <strong>{formattedDate}</strong>
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyTracking}
              leftIcon={isCopying ? <Check className="w-3.5 h-3.5 text-amber-500" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {isCopying ? UI_STRINGS.common.copied : UI_STRINGS.common.copyTracking}
            </Button>

            <Button
              variant="outline"
              size="sm"
              isLoading={isExportingImage}
              onClick={handleExportImage}
              leftIcon={<ImageIcon className="w-3.5 h-3.5" />}
            >
              {UI_STRINGS.common.downloadImage}
            </Button>

            <Button
              variant="navy"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              {UI_STRINGS.common.downloadPdf}
            </Button>
          </div>
        </div>
      </header>

      {/* 1. Top 3 Preferred Roles: Large Flip Cards */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
              {UI_STRINGS.report.top3Title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {UI_STRINGS.report.top3Subtitle}
            </p>
          </div>
          <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium no-print">
            {UI_STRINGS.report.cardFlipHint}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {top3.map((role, idx) => {
            const isFlipped = !!flippedCards[role.code];
            const content = ROLE_CONTENT_MAP[role.code];
            const isClose = role.closeGapWithNext;

            return (
              <div
                key={role.code}
                onClick={() => toggleFlip(role.code)}
                className="perspective-1000 cursor-pointer min-h-[280px]"
              >
                <div
                  className={`flip-inner relative w-full h-full rounded-3xl transition-transform duration-500 transform-style-preserve-3d ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* FRONT of Card */}
                  <div className="flip-face absolute inset-0 backface-hidden p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-amber-400/60 transition-colors">
                    <div>
                      {/* Top Rank Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                          {toPersianDigits(idx + 1)}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-900 dark:text-amber-300 border border-amber-500/20">
                          امتیاز: {formatScore(role.displayScore)}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                        {role.persianTitle}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {role.englishTitle}
                      </p>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-4 leading-relaxed line-clamp-4">
                        در این ارزیابی، {role.persianTitle} از جمله نقش‌هایی است که گرایش طبیعی بیشتری نسبت به آن نشان داده‌اید.
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                      <span>{isClose ? UI_STRINGS.report.closeGapBadge : 'مشاهده جزئیات'}</span>
                      <Repeat className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* BACK of Card (Flipped) */}
                  <div className="flip-face flip-face-back absolute inset-0 backface-hidden rotate-y-180 p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-amber-100 border border-amber-500/40 shadow-xl overflow-y-auto flex flex-col justify-between space-y-3">
                    <div className="space-y-2.5 text-xs text-right">
                      <div className="border-b border-slate-800 pb-1.5 flex items-center justify-between">
                        <span className="font-bold text-amber-300">{role.persianTitle}</span>
                        <span className="text-[10px] text-slate-400">برای چرخش کلیک کنید</span>
                      </div>

                      <div>
                        <span className="font-bold text-amber-400 block text-[11px]">سهم در تیم:</span>
                        <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                          {content.teamContribution}
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-amber-400 block text-[11px]">رفتارها:</span>
                        <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">
                          {content.observableBehaviors}
                        </p>
                      </div>
                    </div>

                    <div className="text-[10px] text-amber-400/80 text-center pt-1 border-t border-slate-800">
                      کلیک برای بازگشت
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Full 9 Roles Profile Chart (Bar & Radar) */}
      <section className="p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-5 page-break-inside-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
              {UI_STRINGS.report.all9Title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {UI_STRINGS.report.all9Subtitle}
            </p>
          </div>

          {/* Toggle between Bar and Radar on screen */}
          <div className="inline-flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 self-start sm:self-auto no-print">
            <button
              type="button"
              onClick={() => setChartMode('bar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                chartMode === 'bar'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-300 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>{UI_STRINGS.report.chartTabHorizontal}</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMode('radar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                chartMode === 'radar'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-300 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>{UI_STRINGS.report.chartTabRadar}</span>
            </button>
          </div>
        </div>

        {/* Bar View */}
        <div className={chartMode === 'radar' ? 'hidden print:block' : 'space-y-3'}>
          <div className="space-y-3">
            {roles.map((role, idx) => {
              const isClose = role.closeGapWithNext;
              const barWidth = Math.max(4, Math.min(100, role.finalScore));

              return (
                <div key={role.code} className="space-y-1">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-center font-bold text-slate-400 text-xs">
                        {toPersianDigits(idx + 1)}
                      </span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {role.persianTitle}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                        ({role.englishTitle})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isClose && (
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                          {UI_STRINGS.report.closeGapBadge}
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {role.categoryTitle}
                      </span>
                      <span className="font-black text-slate-900 dark:text-slate-100 min-w-[2.5rem] text-left tabular-nums text-xs sm:text-sm">
                        {formatScore(role.displayScore)}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar Track */}
                  <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        role.category === 'preferred'
                          ? 'bg-gradient-to-r from-amber-600 via-amber-400 to-amber-500'
                          : role.category === 'manageable'
                          ? 'bg-slate-600 dark:bg-slate-500'
                          : 'bg-slate-400 dark:bg-slate-600'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  {isClose && role.closeGapExplanation && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 pr-7 pt-0.5">
                      {role.closeGapExplanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Radar View (Screen toggle & Always printed in PDF) */}
        <div className={chartMode === 'bar' ? 'hidden print:block print:mt-6' : 'block'}>
          <div className="text-center pt-2">
            <RadarChart roles={roles} size={360} />
          </div>
        </div>
      </section>

      {/* 3. Deep Analysis Accordions (Collapsible) for All Top Roles */}
      <section className="space-y-3 page-break-inside-avoid">
        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
          {UI_STRINGS.report.detailsTitle}
        </h2>

        {top3.map((role, idx) => {
          const content = ROLE_CONTENT_MAP[role.code];

          return (
            <Collapsible
              key={role.code}
              defaultOpen={idx === 0}
              title={`نقش ${role.persianTitle} (${role.englishTitle})`}
              badge={
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300">
                  امتیاز {formatScore(role.displayScore)}
                </span>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{UI_STRINGS.report.contributionLabel}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {content.teamContribution}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <Eye className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{UI_STRINGS.report.behaviorsLabel}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {content.observableBehaviors}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{UI_STRINGS.report.blindSpotLabel}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {content.blindSpot}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <Compass className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{UI_STRINGS.report.conditionsLabel}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {content.bestConditions}
                  </p>
                </div>
              </div>
            </Collapsible>
          );
        })}
      </section>

      {/* 4. Less Preferred Tendencies Insight Note */}
      <section className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 dark:bg-slate-900/60 border border-amber-500/20 dark:border-slate-800 space-y-2 page-break-inside-avoid">
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
          {UI_STRINGS.report.leastTendencyTitle}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {UI_STRINGS.report.leastTendencyDesc(
            roles[6]?.persianTitle,
            roles[7]?.persianTitle,
            roles[8]?.persianTitle
          )}
        </p>
      </section>

      {/* 5. Ethics Closing Disclaimer */}
      <footer className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 text-center space-y-2 page-break-inside-avoid">
        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
          {UI_STRINGS.report.ethicsClosingTitle}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
          {UI_STRINGS.report.ethicsClosingText}
        </p>

        <div className="pt-4 flex items-center justify-center gap-3 no-print">
          <Button variant="primary" size="md" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>
            {UI_STRINGS.common.downloadPdf}
          </Button>
          <Button variant="outline" size="md" onClick={handleRestart} leftIcon={<RotateCcw className="w-4 h-4" />}>
            {UI_STRINGS.common.restart}
          </Button>
        </div>
      </footer>
    </div>
  );
};
