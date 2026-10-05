import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { SessionRecord } from '../../types';
import { ROLE_CODES_LIST } from '../../config';
import { UI_STRINGS } from '../../content/ui.fa';
import { toPersianDigits, formatScore, formatSeconds } from '../../utils/number';
import { runAllUnitTests, TestResult } from '../../test/unitTests';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import {
  Lock,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ArrowRight,
  ShieldCheck,
  Search,
  RefreshCw,
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [testResults, setTestResults] = useState<{ allPassed: boolean; results: TestResult[] } | null>(null);

  const [adminPassword, setAdminPassword] = useState('');
  const [dataSource, setDataSource] = useState<'server' | 'local'>('server');
  const [loginMessage, setLoginMessage] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const loadSessions = async (pwd = adminPassword) => {
    const result = await api.listSessionsAdmin(pwd);
    if (result.status === 'ok') {
      setSessions(result.sessions);
      setDataSource(result.source);
      return true;
    }
    return false;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const result = await api.listSessionsAdmin(passwordInput);
    setIsLoggingIn(false);
    if (result.status === 'ok') {
      setAdminPassword(passwordInput);
      setSessions(result.sessions);
      setDataSource(result.source);
      setIsAuthenticated(true);
      setLoginError(false);
      setLoginMessage('');
    } else {
      setLoginError(true);
      setLoginMessage(result.status === 'unconfigured' ? UI_STRINGS.admin.passwordNotConfigured : '');
    }
  };

  const handleRunTests = () => {
    const result = runAllUnitTests();
    setTestResults(result);
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `belbin_sessions_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export CSV
  const handleExportCSV = () => {
    if (sessions.length === 0) return;

    const headers = [
      'SessionID',
      'TrackingCode',
      'Name',
      'Mobile',
      'OrgCode',
      'StartedAt',
      'FinishedAt',
      'InstrumentVersion',
      'RQIScore',
      'RQILevel',
      'SpeedDeductionA',
      'SpeedDeductionB',
      'SideBiasDeductionA',
      'SpearmanAvg',
      'SpearmanDeduction',
      ...ROLE_CODES_LIST.map((c) => `Final_${c}`),
      'Top1_Role',
      'Top2_Role',
      'Top3_Role',
    ];

    const rows = sessions.map((s) => {
      const row = [
        `"${s.sessionId}"`,
        `"${s.trackingCode || ''}"`,
        `"${s.participantName || ''}"`,
        `"${s.participantProfile?.mobile || ''}"`,
        `"${s.participantProfile?.orgCode || ''}"`,
        `"${s.startedAt}"`,
        `"${s.finishedAt}"`,
        `"${s.instrumentVersion}"`,
        s.rqi?.score ?? '',
        `"${s.rqi?.levelLabel ?? ''}"`,
        s.rqi?.deductions?.speedA ?? 0,
        s.rqi?.deductions?.speedB ?? 0,
        s.rqi?.deductions?.sideBiasA ?? 0,
        s.rqi?.details?.avgSpearman?.toFixed(3) ?? '',
        s.rqi?.deductions?.spearman ?? 0,
        ...ROLE_CODES_LIST.map((c) => s.scoring?.finalTotals[c]?.toFixed(1) ?? ''),
        `"${s.scoring?.top3[0]?.persianTitle || ''}"`,
        `"${s.scoring?.top3[1]?.persianTitle || ''}"`,
        `"${s.scoring?.top3[2]?.persianTitle || ''}"`,
      ];
      return row.join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `belbin_sessions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = s.participantName?.toLowerCase().includes(query);
    const mobileMatch = s.participantProfile?.mobile?.includes(query);
    const trackingMatch = s.trackingCode?.toLowerCase().includes(query);
    const idMatch = s.sessionId.toLowerCase().includes(query);
    return nameMatch || mobileMatch || trackingMatch || idMatch;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 dark:bg-amber-500 text-amber-300 dark:text-slate-950 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-6 h-6" />
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {UI_STRINGS.admin.loginTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {UI_STRINGS.admin.loginSubtitle}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-pwd" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {UI_STRINGS.admin.passwordLabel}
              </label>
              <input
                id="admin-pwd"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder={UI_STRINGS.admin.passwordPlaceholder}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-left"
                dir="ltr"
              />
              {loginError && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  {loginMessage || UI_STRINGS.admin.invalidPassword}
                </p>
              )}
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isLoggingIn}>
              {UI_STRINGS.admin.loginButton}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="w-full"
            >
              {UI_STRINGS.common.backToApp}
            </Button>
          </form>

          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            {UI_STRINGS.admin.authNotice}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      {/* Admin Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-900 dark:text-amber-300 text-[11px] font-bold">
              {UI_STRINGS.admin.badge}
            </span>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
              {UI_STRINGS.admin.title}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {UI_STRINGS.admin.totalSessions} <strong>{toPersianDigits(sessions.length)}</strong> جلسه ثبت‌شده
          </p>
          {dataSource === 'local' && (
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 font-medium">
              {UI_STRINGS.admin.localDataNotice}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunTests}
            leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
          >
            {UI_STRINGS.admin.runTests}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={sessions.length === 0}
            leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
          >
            {UI_STRINGS.admin.exportCsv}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            disabled={sessions.length === 0}
            leftIcon={<FileJson className="w-3.5 h-3.5" />}
          >
            {UI_STRINGS.admin.exportJson}
          </Button>

          <Button
            variant="navy"
            size="sm"
            onClick={() => navigate('/')}
            leftIcon={<ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />}
          >
            {UI_STRINGS.common.backToApp}
          </Button>
        </div>
      </header>

      {/* Embedded Unit Test Results */}
      {testResults && (
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              {testResults.allPassed ? (
                <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              )}
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                نتایج آزمون‌های خودکار توازن، الگوریتم‌ها و RQI
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setTestResults(null)}
              className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              بستن
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {testResults.results.map((r, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-start gap-2"
              >
                <span className="font-bold text-amber-600 dark:text-amber-400">{r.passed ? '✓' : '✗'}</span>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{r.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{r.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={UI_STRINGS.admin.searchPlaceholder}
            className="w-full pr-10 pl-3 py-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <button
          type="button"
          onClick={() => loadSessions()}
          className="p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-400 cursor-pointer transition shadow-xs"
          title={UI_STRINGS.admin.refresh}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Sessions Table */}
      <div className="p-1 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="p-3.5">{UI_STRINGS.admin.tableColName}</th>
                <th className="p-3.5">{UI_STRINGS.admin.tableColDate}</th>
                <th className="p-3.5">{UI_STRINGS.admin.tableColRqi}</th>
                <th className="p-3.5">{UI_STRINGS.admin.tableColLevel}</th>
                <th className="p-3.5">{UI_STRINGS.admin.tableColTop3}</th>
                <th className="p-3.5 text-center">{UI_STRINGS.admin.tableColActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    {UI_STRINGS.admin.noSessions}
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => {
                  const rqi = session.rqi;
                  const top3Names = session.scoring?.top3?.map((r) => r.persianTitle).join('، ') || '—';

                  return (
                    <tr key={session.sessionId} className="hover:bg-amber-50/20 dark:hover:bg-slate-800/50 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {session.participantName || 'ناشناس'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {session.trackingCode || session.sessionId.slice(0, 8)}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">
                        {new Date(session.finishedAt).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="p-3.5 font-black text-slate-900 dark:text-slate-100 tabular-nums">
                        {toPersianDigits(rqi?.score ?? 0)}
                      </td>
                      <td className="p-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-900 dark:text-amber-300 border border-amber-500/20">
                          {rqi?.levelLabel || 'نامشخص'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">
                        {top3Names}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedSession(session)}
                          className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-400 hover:text-slate-950 transition cursor-pointer text-slate-700 dark:text-slate-300"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Details Modal */}
      <Modal
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        title={UI_STRINGS.admin.modalTitle}
        maxWidth="lg"
      >
        {selectedSession && (
          <div className="space-y-4 text-xs">
            {/* Participant Bio */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block">
                  {selectedSession.participantName || 'ناشناس'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  کد پیگیری: {selectedSession.trackingCode || '—'}
                </span>
              </div>
              <div className="text-left font-mono text-[11px] text-slate-500">
                نسخه: {selectedSession.instrumentVersion}
              </div>
            </div>

            {/* RQI Audit Card */}
            <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  {UI_STRINGS.admin.modalRqiSection}
                </span>
                <span className="text-base font-black text-amber-900 dark:text-amber-200 tabular-nums">
                  {toPersianDigits(selectedSession.rqi.score)} / ۱۰۰ ({selectedSession.rqi.levelLabel})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400">سرعت بخش A (&lt;1.5s)</div>
                  <div className="font-bold mt-1">
                    {toPersianDigits(selectedSession.rqi.details.fastCountA)} مورد (کسر: {toPersianDigits(selectedSession.rqi.deductions.speedA)})
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400">سرعت بخش B (&lt;4.0s)</div>
                  <div className="font-bold mt-1">
                    {toPersianDigits(selectedSession.rqi.details.fastCountB)} مورد (کسر: {toPersianDigits(selectedSession.rqi.deductions.speedB)})
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400">سوگیری سمتی A (&gt;80%)</div>
                  <div className="font-bold mt-1">
                    {toPersianDigits(Math.round(selectedSession.rqi.details.maxSidePercentA))}٪ (کسر: {toPersianDigits(selectedSession.rqi.deductions.sideBiasA)})
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400">همبستگی اسپیرمن</div>
                  <div className="font-bold mt-1">
                    {toPersianDigits(selectedSession.rqi.details.avgSpearman.toFixed(2))} (کسر: {toPersianDigits(selectedSession.rqi.deductions.spearman)})
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 border-t border-amber-500/20 pt-1.5 leading-relaxed">
                ⚠️ {selectedSession.rqi.warningNote}
              </p>
            </div>

            {/* 9 Roles Vectors Table */}
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                {UI_STRINGS.admin.modalVectorsSection}
              </h4>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-2">کد</th>
                      <th className="p-2">عنوان فارسی</th>
                      <th className="p-2">خام A</th>
                      <th className="p-2">خام B</th>
                      <th className="p-2">خام C</th>
                      <th className="p-2">FC%</th>
                      <th className="p-2">SJT%</th>
                      <th className="p-2">GAME%</th>
                      <th className="p-2 font-bold">نهایی</th>
                      <th className="p-2">رتبه</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedSession.scoring.roles.map((r) => (
                      <tr key={r.code}>
                        <td className="p-2 font-mono font-bold">{r.code}</td>
                        <td className="p-2">{r.persianTitle}</td>
                        <td className="p-2">{toPersianDigits(r.rawA)}</td>
                        <td className="p-2">{toPersianDigits(r.rawB)}</td>
                        <td className="p-2">{toPersianDigits(r.rawC)}</td>
                        <td className="p-2 text-slate-400">{toPersianDigits(Math.round(r.fc))}</td>
                        <td className="p-2 text-slate-400">{toPersianDigits(Math.round(r.sjt))}</td>
                        <td className="p-2 text-slate-400">{toPersianDigits(Math.round(r.game))}</td>
                        <td className="p-2 font-bold text-amber-700 dark:text-amber-400">{formatScore(r.displayScore)}</td>
                        <td className="p-2 font-bold">{toPersianDigits(r.rank)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Timing Audit Summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">میانگین زمان بخش A</span>
                <span className="font-bold">
                  {formatSeconds(
                    selectedSession.responsesA.reduce((a, b) => a + b.responseTimeMs, 0) /
                      Math.max(1, selectedSession.responsesA.length)
                  )}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">میانگین زمان بخش B</span>
                <span className="font-bold">
                  {formatSeconds(
                    selectedSession.responsesB.reduce((a, b) => a + b.responseTimeMs, 0) /
                      Math.max(1, selectedSession.responsesB.length)
                  )}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px]">میانگین زمان بخش C</span>
                <span className="font-bold">
                  {formatSeconds(
                    selectedSession.responsesC.reduce((a, b) => a + b.responseTimeMs, 0) /
                      Math.max(1, selectedSession.responsesC.length)
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
