import { SessionRecord, InProgressAssessment } from './types';

export interface StorageService {
  saveSession(session: SessionRecord): Promise<void>;
  getSession(sessionId: string): Promise<SessionRecord | null>;
  listSessions(): Promise<SessionRecord[]>;
  saveCurrentProgress(progress: InProgressAssessment): Promise<void>;
  getCurrentProgress(): Promise<InProgressAssessment | null>;
  clearCurrentProgress(): Promise<void>;
}

const STORAGE_KEYS = {
  SESSIONS: 'belbin_eval_sessions_v1',
  PROGRESS: 'belbin_eval_progress_v1',
};

class LocalStorageService implements StorageService {
  async saveSession(session: SessionRecord): Promise<void> {
    try {
      const existing = await this.listSessions();
      // Replace if existing ID, or prepend
      const index = existing.findIndex((s) => s.sessionId === session.sessionId);
      if (index >= 0) {
        existing[index] = session;
      } else {
        existing.unshift(session);
      }
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(existing));
    } catch (e) {
      console.error('Failed to save session to localStorage', e);
    }
  }

  async getSession(sessionId: string): Promise<SessionRecord | null> {
    const list = await this.listSessions();
    return list.find((s) => s.sessionId === sessionId) || null;
  }

  async listSessions(): Promise<SessionRecord[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (!data) return [];
      return JSON.parse(data) as SessionRecord[];
    } catch (e) {
      console.error('Failed to parse sessions from localStorage', e);
      return [];
    }
  }

  async saveCurrentProgress(progress: InProgressAssessment): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save progress to localStorage', e);
    }
  }

  async getCurrentProgress(): Promise<InProgressAssessment | null> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (!data) return null;
      return JSON.parse(data) as InProgressAssessment;
    } catch (e) {
      console.error('Failed to parse progress from localStorage', e);
      return null;
    }
  }

  async clearCurrentProgress(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    } catch (e) {
      console.error('Failed to clear progress from localStorage', e);
    }
  }
}

export const storage: StorageService = new LocalStorageService();
