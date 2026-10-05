import React, { useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { Button } from '../../components/Button';
import { UI_STRINGS } from '../../content/ui.fa';
import { auth, validateNationalId, LoginResult } from '../../services/auth';
import { validateIranMobile } from '../../utils/number';
import { SessionRecord } from '../../types';

interface LoginFormProps {
  onLoggedIn: (latest: SessionRecord | null) => void;
}

const inputBase =
  'w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2';

export const LoginForm: React.FC<LoginFormProps> = ({ onLoggedIn }) => {
  const L = UI_STRINGS.login;
  const [phone, setPhone] = useState('');
  const [nid, setNid] = useState('');
  const [showNid, setShowNid] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [nidError, setNidError] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const errorFor = (status: Exclude<LoginResult['status'], 'ok'>) => {
    switch (status) {
      case 'invalid_credentials':
        return L.invalidCredentials;
      case 'locked':
        return L.locked;
      case 'network':
        return L.network;
      default:
        return L.server;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const okPhone = validateIranMobile(phone);
    const okNid = validateNationalId(nid);
    setPhoneError(okPhone ? '' : L.phoneError);
    setNidError(okNid ? '' : L.nationalIdError);
    if (!okPhone || !okNid) return;

    setIsLoading(true);
    const result = await auth.login(phone, nid);
    setIsLoading(false);

    if (result.status === 'ok') {
      onLoggedIn(result.latest);
    } else {
      setFormError(errorFor(result.status));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-md space-y-4"
    >
      <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">{L.title}</h2>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{L.subtitle}</p>
      </div>

      <div>
        <label htmlFor="p-mobile" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          {L.phone}
        </label>
        <input
          id="p-mobile"
          type="tel"
          inputMode="numeric"
          autoComplete="username"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (phoneError) setPhoneError('');
          }}
          placeholder={L.phonePlaceholder}
          dir="ltr"
          className={`${inputBase} ${phoneError ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 dark:border-slate-700 focus:ring-amber-400'}`}
        />
        {phoneError && <p className="text-[11px] text-rose-500 mt-1">{phoneError}</p>}
      </div>

      <div>
        <label htmlFor="p-nid" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          {L.nationalId}
        </label>
        <div className="relative">
          <input
            id="p-nid"
            type={showNid ? 'text' : 'password'}
            inputMode="numeric"
            autoComplete="current-password"
            maxLength={10}
            value={nid}
            onChange={(e) => {
              setNid(e.target.value);
              if (nidError) setNidError('');
            }}
            placeholder={L.nationalIdPlaceholder}
            dir="ltr"
            className={`${inputBase} pl-10 ${nidError ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 dark:border-slate-700 focus:ring-amber-400'}`}
          />
          <button
            type="button"
            onClick={() => setShowNid((v) => !v)}
            aria-label={showNid ? L.hide : L.show}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            {showNid ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {nidError ? (
          <p className="text-[11px] text-rose-500 mt-1">{nidError}</p>
        ) : (
          <p className="text-[10px] text-slate-400 mt-1">{L.nationalIdHint}</p>
        )}
      </div>

      {formError && (
        <p role="alert" className="text-xs text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/30 rounded-xl px-3 py-2">
          {formError}
        </p>
      )}

      <p className="text-[10px] text-slate-400 leading-relaxed">{UI_STRINGS.start.privacyNote}</p>

      <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full" leftIcon={<LogIn className="w-5 h-5" />}>
        {L.submit}
      </Button>
    </form>
  );
};
