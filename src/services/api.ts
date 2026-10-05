import { SessionRecord, InProgressAssessment } from '../types';
import { BRAND_CONFIG } from '../config/brand';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

type SyncListener = (status: SyncStatus) => void;

const SESSIONS_STORAGE_KEY = 'belbin_eval_sessions_v1';
const PROGRESS_STORAGE_KEY = 'belbin_eval_progress_v1';
const PENDING_STORAGE_KEY = 'belbin_eval_pending_v1';

class ApiService {
  private syncStatus: SyncStatus = 'idle';
  private listeners: Set<SyncListener> = new Set();
  private simulatedOffline = false;

  public subscribeSync(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.syncStatus);
    return () => this.listeners.delete(listener);
  }

  private setSyncStatus(status: SyncStatus) {
    this.syncStatus = status;
    this.listeners.forEach((fn) => fn(status));
  }

  public setSimulatedOffline(isOffline: boolean) {
    this.simulatedOffline = isOffline;
  }

  public isOffline(): boolean {
    return this.simulatedOffline || (typeof navigator !== 'undefined' && !navigator.onLine);
  }

  // Artificial delay to simulate real cloud network persistence
  private delay(ms = 350): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private readLocalSessions(): SessionRecord[] {
    try {
      const data = localStorage.getItem(SESSIONS_STORAGE_KEY);
      return data ? (JSON.parse(data) as SessionRecord[]) : [];
    } catch (e) {
      console.error('Failed to parse sessions', e);
      return [];
    }
  }

  private writeLocalSession(session: SessionRecord) {
    try {
      const list = this.readLocalSessions();
      const index = list.findIndex((s) => s.sessionId === session.sessionId);
      if (index >= 0) list[index] = session;
      else list.unshift(session);
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Local backup failed', e);
    }
  }

  private readPending(): string[] {
    try {
      return JSON.parse(localStorage.getItem(PENDING_STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  private writePending(ids: string[]) {
    try {
      localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  }

  private async postSession(session: SessionRecord): Promise<void> {
    if (this.simulatedOffline) throw new Error('Network simulated offline');
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    if (!res.ok) throw new Error(`POST /api/sessions failed: ${res.status}`);
  }

  /**
   * Saves a completed session: always kept locally (so the participant's report never depends on
   * the network), and sent to the server (Neon via /api/sessions). Failed uploads are queued and
   * retried by `flushPendingSessions`.
   */
  async saveSession(session: SessionRecord): Promise<void> {
    this.setSyncStatus('saving');
    this.writeLocalSession(session);

    try {
      await this.postSession(session);
      this.writePending(this.readPending().filter((id) => id !== session.sessionId));
      this.setSyncStatus('saved');
      setTimeout(() => this.setSyncStatus('idle'), 2500);
    } catch (err) {
      console.error('Failed to sync session to server; queued for retry', err);
      const pending = this.readPending();
      if (!pending.includes(session.sessionId)) this.writePending([...pending, session.sessionId]);
      this.setSyncStatus('error');
    }
  }

  /** Retries uploads that previously failed (offline, server error). */
  async flushPendingSessions(): Promise<void> {
    const pending = this.readPending();
    if (pending.length === 0 || this.isOffline()) return;
    const local = this.readLocalSessions();
    const remaining: string[] = [];
    for (const id of pending) {
      const session = local.find((s) => s.sessionId === id);
      if (!session) continue;
      try {
        await this.postSession(session);
      } catch {
        remaining.push(id);
      }
    }
    this.writePending(remaining);
  }

  /**
   * Retrieves single session by ID (local cache; used for the participant's own report)
   */
  async getSession(sessionId: string): Promise<SessionRecord | null> {
    return this.readLocalSessions().find((s) => s.sessionId === sessionId) || null;
  }

  /**
   * Admin: lists all sessions from the server. `source: 'local'` means the backend is not
   * reachable (e.g. local dev without `vercel dev`) and only this browser's sessions are shown.
   */
  async listSessionsAdmin(
    adminPassword: string
  ): Promise<
    | { status: 'ok'; sessions: SessionRecord[]; source: 'server' | 'local' }
    | { status: 'unauthorized' | 'unconfigured' }
  > {
    try {
      const res = await fetch('/api/sessions', { headers: { 'x-admin-password': adminPassword } });
      if (res.status === 401) return { status: 'unauthorized' };
      if (res.status === 503) return { status: 'unconfigured' };
      if (res.ok && (res.headers.get('content-type') || '').includes('application/json')) {
        const body = await res.json();
        return { status: 'ok', sessions: body.sessions as SessionRecord[], source: 'server' };
      }
    } catch (e) {
      console.error('Admin fetch failed', e);
    }
    // Backend not available: only in dev allow the local demo fallback.
    if (import.meta.env.DEV && adminPassword === BRAND_CONFIG.adminDemoPassword) {
      return { status: 'ok', sessions: this.readLocalSessions(), source: 'local' };
    }
    return { status: 'unauthorized' };
  }

  /**
   * Saves active assessment progress
   * // TODO: wire to real API (PUT /api/progress/:sessionId)
   */
  async saveProgress(progress: InProgressAssessment): Promise<void> {
    this.setSyncStatus('saving');
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
      await this.delay(200);
      this.setSyncStatus('saved');
      setTimeout(() => {
        if (this.syncStatus === 'saved') this.setSyncStatus('idle');
      }, 2000);
    } catch (e) {
      this.setSyncStatus('error');
    }
  }

  /**
   * Retrieves active assessment progress
   */
  async getProgress(): Promise<InProgressAssessment | null> {
    try {
      const data = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data) as InProgressAssessment;
    } catch (e) {
      return null;
    }
  }

  /**
   * Clears active assessment progress upon completion
   */
  async clearProgress(): Promise<void> {
    try {
      localStorage.removeItem(PROGRESS_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear progress', e);
    }
  }
}

export const api = new ApiService();
