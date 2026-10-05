import { SessionRecord } from '../types';
import { normalizeToEnglishDigits } from '../utils/number';

const AUTH_STORAGE_KEY = 'naghshnama_auth_v1';

export interface AuthUser {
  phone: string;
  token: string;
  fullName?: string;
}

export type LoginResult =
  | { status: 'ok'; user: AuthUser; latest: SessionRecord | null }
  | { status: 'invalid_credentials' | 'locked' | 'network' | 'server' };

type Listener = (user: AuthUser | null) => void;

/**
 * Iranian national ID validation (10 digits + checksum).
 */
export function validateNationalId(raw: string): boolean {
  const id = normalizeToEnglishDigits(raw).replace(/[\s-]/g, '');
  if (!/^\d{10}$/.test(id) || /^(\d)\1{9}$/.test(id)) return false;
  const check = Number(id[9]);
  const sum = id
    .slice(0, 9)
    .split('')
    .reduce((acc, d, i) => acc + Number(d) * (10 - i), 0) % 11;
  return sum < 2 ? check === sum : check === 11 - sum;
}

/** Canonical 09xxxxxxxxx form */
export function normalizePhone(raw: string): string {
  let p = normalizeToEnglishDigits(raw).replace(/[\s-]/g, '');
  if (p.startsWith('+98')) p = '0' + p.slice(3);
  else if (p.startsWith('0098')) p = '0' + p.slice(4);
  else if (/^9\d{9}$/.test(p)) p = '0' + p;
  return p;
}

class AuthService {
  private user: AuthUser | null = null;
  private listeners = new Set<Listener>();

  constructor() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.phone && parsed?.token) this.user = parsed;
      }
    } catch {
      /* ignore */
    }
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  getToken(): string | null {
    return this.user?.token ?? null;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private set(user: AuthUser | null) {
    this.user = user;
    try {
      if (user) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    this.listeners.forEach((fn) => fn(user));
  }

  /**
   * username = mobile number, password = national ID (verified on the server; never stored client-side).
   */
  async login(phoneRaw: string, nationalIdRaw: string): Promise<LoginResult> {
    const phone = normalizePhone(phoneRaw);
    const nationalId = normalizeToEnglishDigits(nationalIdRaw).replace(/[\s-]/g, '');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, nationalId }),
      });
      const isJson = (res.headers.get('content-type') || '').includes('application/json');

      if (res.ok && isJson) {
        const body = await res.json();
        const user: AuthUser = { phone: body.phone as string, token: body.token as string, fullName: body.fullName || undefined };
        this.set(user);
        return { status: 'ok', user, latest: (body.latest as SessionRecord) || null };
      }
      if (res.status === 401) return { status: 'invalid_credentials' };
      if (res.status === 429) return { status: 'locked' };
      if (res.status >= 500 && isJson) return { status: 'server' };
      // 404 / HTML response => no backend (e.g. `npm run dev` without `vercel dev`)
    } catch (e) {
      console.error('Login request failed', e);
    }

    if (import.meta.env.DEV) {
      // Local development without a backend: accept any valid credentials.
      const user = { phone, token: 'dev-local' };
      this.set(user);
      return { status: 'ok', user, latest: null };
    }
    return { status: 'network' };
  }

  logout() {
    this.set(null);
  }
}

export const auth = new AuthService();
