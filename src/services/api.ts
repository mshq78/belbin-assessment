import { SessionRecord, InProgressAssessment } from '../types';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

type SyncListener = (status: SyncStatus) => void;

const SESSIONS_STORAGE_KEY = 'belbin_eval_sessions_v1';
const PROGRESS_STORAGE_KEY = 'belbin_eval_progress_v1';

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

  /**
   * Saves completed assessment session.
   * // TODO: wire to real API (Neon PostgreSQL + Vercel Serverless Function /api/sessions)
   */
  async saveSession(session: SessionRecord): Promise<void> {
    this.setSyncStatus('saving');
    await this.delay(450);

    try {
      if (this.simulatedOffline) {
        throw new Error('Network simulated offline');
      }

      // Read existing
      const existing = await this.listSessions();
      const index = existing.findIndex((s) => s.sessionId === session.sessionId);
      if (index >= 0) {
        existing[index] = session;
      } else {
        existing.unshift(session);
      }

      // Persist in localStorage (fallback / primary client cache)
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(existing));

      // TODO: Replace with real HTTP POST:
      // await fetch('/api/sessions', { method: 'POST', body: JSON.stringify(session) });

      this.setSyncStatus('saved');
      setTimeout(() => this.setSyncStatus('idle'), 2500);
    } catch (err) {
      console.error('Failed to sync session to cloud/storage', err);
      this.setSyncStatus('error');
      // Still persist locally
      try {
        const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
        const list = raw ? JSON.parse(raw) : [];
        list.unshift(session);
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {
        console.error('Local backup failed', e);
      }
    }
  }

  /**
   * Retrieves single session by ID
   * // TODO: wire to real API (GET /api/sessions/:id)
   */
  async getSession(sessionId: string): Promise<SessionRecord | null> {
    const list = await this.listSessions();
    return list.find((s) => s.sessionId === sessionId) || null;
  }

  /**
   * Lists all sessions
   * // TODO: wire to real API (GET /api/sessions)
   */
  async listSessions(): Promise<SessionRecord[]> {
    await this.delay(100);
    try {
      const data = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as SessionRecord[];
    } catch (e) {
      console.error('Failed to parse sessions', e);
      return [];
    }
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
