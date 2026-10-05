import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Download, Trash2, RefreshCw, CheckCircle2, AlertTriangle, UserPlus } from 'lucide-react';
import { api, AdminUser } from '../../services/api';
import { UI_STRINGS } from '../../content/ui.fa';
import { Button } from '../../components/Button';
import { toPersianDigits } from '../../utils/number';
import { ImportRow, parseUsersFile, TEMPLATE_CSV, normalizeNationalIdInput, normalizePersianLetters } from '../../utils/usersImport';
import { normalizePhone, validateNationalId } from '../../services/auth';

const S = UI_STRINGS.adminUsers;
const CHUNK = 40;

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }) : S.never;

export const UsersPanel: React.FC<{ adminPassword: string }> = ({ adminPassword }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');
  const [listError, setListError] = useState('');

  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [parsing, setParsing] = useState(false);

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ created: number; updated: number; failed: number } | null>(null);
  const [importError, setImportError] = useState('');

  // Single-user form
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addNid, setAddNid] = useState('');
  const [addErrors, setAddErrors] = useState<{ name?: string; phone?: string; nid?: string }>({});
  const [adding, setAdding] = useState(false);
  const [addMessage, setAddMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMessage(null);
    const name = normalizePersianLetters(addName).replace(/\s+/g, ' ').trim();
    const phone = normalizePhone(addPhone);
    const nid = normalizeNationalIdInput(addNid);
    const errs = {
      name: name ? undefined : S.nameRequired,
      phone: /^09\d{9}$/.test(phone) ? undefined : S.phoneInvalid,
      nid: validateNationalId(nid) ? undefined : S.nidInvalid,
    };
    setAddErrors(errs);
    if (errs.name || errs.phone || errs.nid) return;

    setAdding(true);
    try {
      const res = await api.importUsersAdmin(adminPassword, [{ fullName: name, phone, nationalId: nid }]);
      if (res.errors.length > 0) throw new Error('rejected');
      setAddMessage({ ok: true, text: res.updated > 0 ? S.addedUpdated : S.addedNew });
      setAddName('');
      setAddPhone('');
      setAddNid('');
      await loadUsers();
    } catch (err) {
      setAddMessage({
        ok: false,
        text: err instanceof Error && err.message === 'backend_unavailable' ? S.backendUnavailable : S.addFailed,
      });
    } finally {
      setAdding(false);
    }
  };

  const loadUsers = useCallback(async () => {
    try {
      setUsers(await api.listUsersAdmin(adminPassword));
      setListError('');
    } catch (e) {
      setListError(e instanceof Error && e.message === 'backend_unavailable' ? S.backendUnavailable : 'خطا در دریافت فهرست کاربران');
    }
  }, [adminPassword]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const validRows = useMemo(() => (rows || []).filter((r) => r.errors.length === 0), [rows]);
  const invalidCount = (rows?.length || 0) - validRows.length;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setParsing(true);
    setParseError('');
    setResult(null);
    setImportError('');
    setRows(null);
    setFileName(file.name);
    try {
      const parsed = await parseUsersFile(file);
      if (parsed.length === 0) setParseError(S.emptyFile);
      else setRows(parsed);
    } catch (e) {
      console.error(e);
      setParseError(S.parseFailed);
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setImportError('');
    setProgress(0);
    let created = 0;
    let updated = 0;
    let failed = 0;
    try {
      for (let i = 0; i < validRows.length; i += CHUNK) {
        const chunk = validRows.slice(i, i + CHUNK);
        const res = await api.importUsersAdmin(
          adminPassword,
          chunk.map((r) => ({ fullName: r.fullName, phone: r.phone, nationalId: r.nationalId }))
        );
        created += res.created;
        updated += res.updated;
        failed += res.errors.length;
        setProgress(Math.min(100, Math.round(((i + chunk.length) / validRows.length) * 100)));
      }
      setResult({ created, updated, failed: failed + invalidCount });
      setRows(null);
      await loadUsers();
    } catch (e) {
      setImportError(
        e instanceof Error && e.message === 'backend_unavailable' ? S.backendUnavailable : 'ثبت کاربران با خطا مواجه شد. دوباره تلاش کنید.'
      );
      if (created || updated) await loadUsers();
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (u: AdminUser) => {
    if (!window.confirm(S.confirmDelete)) return;
    try {
      await api.deleteUserAdmin(adminPassword, u.phone);
      setUsers((prev) => prev.filter((x) => x.phone !== u.phone));
    } catch {
      setListError('حذف انجام نشد');
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'naghshnama_users_template.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  };

  const filtered = users.filter((u) => {
    const q = query.trim().toLowerCase();
    return !q || (u.fullName || '').toLowerCase().includes(q) || u.phone.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Add single user */}
      <section className="p-5 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">{S.addTitle}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{S.addHint}</p>
        </div>
        <form onSubmit={handleAdd} noValidate className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
          {([
            { id: 'add-name', label: S.fieldName, value: addName, set: setAddName, ph: S.fieldNamePlaceholder, err: addErrors.name, ltr: false, type: 'text' },
            { id: 'add-phone', label: S.fieldPhone, value: addPhone, set: setAddPhone, ph: '09123456789', err: addErrors.phone, ltr: true, type: 'tel' },
            { id: 'add-nid', label: S.fieldNid, value: addNid, set: setAddNid, ph: '0123456789', err: addErrors.nid, ltr: true, type: 'text' },
          ] as const).map((f) => (
            <div key={f.id}>
              <label htmlFor={f.id} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{f.label}</label>
              <input
                id={f.id}
                type={f.type}
                inputMode={f.ltr ? 'numeric' : undefined}
                dir={f.ltr ? 'ltr' : undefined}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.ph}
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 ${
                  f.err ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 dark:border-slate-700 focus:ring-amber-400'
                }`}
              />
              {f.err && <p className="text-[11px] text-rose-500 mt-1">{f.err}</p>}
            </div>
          ))}
          <div className="sm:col-span-3 flex flex-wrap items-center gap-3">
            <Button type="submit" variant="primary" size="md" isLoading={adding} leftIcon={<UserPlus className="w-4 h-4" />}>
              {S.addButton}
            </Button>
            {addMessage && (
              <p role={addMessage.ok ? 'status' : 'alert'} className={`text-xs font-medium ${addMessage.ok ? 'text-amber-800 dark:text-amber-300' : 'text-rose-600 dark:text-rose-400'}`}>
                {addMessage.text}
              </p>
            )}
          </div>
        </form>
      </section>

      {/* Import card */}
      <section className="p-5 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">{S.importTitle}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{S.importHint}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{S.updateNote}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
            data-testid="users-file"
          />
          <Button variant="primary" size="sm" isLoading={parsing} onClick={() => fileRef.current?.click()} leftIcon={<Upload className="w-3.5 h-3.5" />}>
            {S.chooseFile}
          </Button>
          <Button variant="outline" size="sm" onClick={downloadTemplate} leftIcon={<Download className="w-3.5 h-3.5" />}>
            {S.downloadTemplate}
          </Button>
          {fileName && <span className="text-xs text-slate-500 dark:text-slate-400" dir="ltr">{fileName}</span>}
        </div>

        {parseError && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400 font-medium">{parseError}</p>}

        {rows && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800">{S.summaryTotal}: <strong>{toPersianDigits(rows.length)}</strong></span>
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">{S.summaryValid}: <strong>{toPersianDigits(validRows.length)}</strong></span>
              {invalidCount > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200">{S.summaryInvalid}: <strong>{toPersianDigits(invalidCount)}</strong></span>
              )}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="p-2.5">{S.colRow}</th>
                    <th className="p-2.5">{S.colName}</th>
                    <th className="p-2.5">{S.colPhone}</th>
                    <th className="p-2.5">{S.colNid}</th>
                    <th className="p-2.5">{S.colStatus}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rows.slice(0, 50).map((r) => (
                    <tr key={r.rowNumber} className={r.errors.length ? 'bg-rose-50/60 dark:bg-rose-950/20' : ''}>
                      <td className="p-2.5">{toPersianDigits(r.rowNumber)}</td>
                      <td className="p-2.5">{r.fullName || '—'}</td>
                      <td className="p-2.5" dir="ltr">{r.phone}</td>
                      <td className="p-2.5" dir="ltr">{r.nationalId}</td>
                      <td className="p-2.5">
                        {r.errors.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300"><CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />{S.statusOk}</span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400">{r.errors.map((e) => S.reasons[e]).join('، ')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 50 && <p className="text-[11px] text-slate-400">{S.previewNote}</p>}

            {importing && (
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-amber-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
            <Button variant="primary" size="md" isLoading={importing} disabled={validRows.length === 0} onClick={handleImport}>
              {importing ? S.importing : `${S.importButton} (${toPersianDigits(validRows.length)})`}
            </Button>
          </div>
        )}

        {importError && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400 font-medium">{importError}</p>}

        {result && (
          <div role="status" className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-950 dark:text-amber-100 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-bold">{S.importDone}</span>
            <span>{S.created}: <strong>{toPersianDigits(result.created)}</strong></span>
            <span>{S.updated}: <strong>{toPersianDigits(result.updated)}</strong></span>
            {result.failed > 0 && <span className="inline-flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />{S.failed}: <strong>{toPersianDigits(result.failed)}</strong></span>}
          </div>
        )}
      </section>

      {/* Users list */}
      <section className="p-5 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            {S.listTitle} <span className="text-xs font-medium text-slate-500">({toPersianDigits(users.length)})</span>
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={S.searchPlaceholder}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button type="button" onClick={loadUsers} title="بارگذاری مجدد" className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {listError && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400 font-medium">{listError}</p>}

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="p-2.5">{S.colName}</th>
                <th className="p-2.5">{S.colPhone}</th>
                <th className="p-2.5">{S.colCreated}</th>
                <th className="p-2.5">{S.colLastLogin}</th>
                <th className="p-2.5">{S.colSessions}</th>
                <th className="p-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">{S.noUsers}</td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.phone}>
                    <td className="p-2.5 font-medium">{u.fullName || '—'}</td>
                    <td className="p-2.5" dir="ltr">{u.phone}</td>
                    <td className="p-2.5">{fmtDate(u.createdAt)}</td>
                    <td className="p-2.5">{fmtDate(u.lastLoginAt)}</td>
                    <td className="p-2.5">{toPersianDigits(u.sessions)}</td>
                    <td className="p-2.5 text-left">
                      <button type="button" onClick={() => handleDelete(u)} className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:underline">
                        <Trash2 className="w-3.5 h-3.5" />
                        {S.delete}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
