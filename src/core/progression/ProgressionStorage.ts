import { MemberProgress, FamilyProgress, SessionProgress, XPEvent } from './types';

const MEMBER_PROGRESS_PREFIX = 'neonflow_progression_member_';
const FAMILY_PROGRESS_PREFIX = 'neonflow_progression_family_';
const SESSION_PROGRESS_PREFIX = 'neonflow_progression_session_';
const LOGS_STORAGE_KEY = 'neonflow_progression_logs';

export interface XPLogEntry {
  event: XPEvent;
  xpGained: number;
}

export class ProgressionStorage {
  private static safeGetItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      // Ignore storage access errors
    }
    return null;
  }

  private static safeSetItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      // Ignore storage quota errors
    }
  }

  static loadMemberProgress(memberId: string): MemberProgress | null {
    const raw = this.safeGetItem(`${MEMBER_PROGRESS_PREFIX}${memberId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  static saveMemberProgress(progress: MemberProgress): void {
    this.safeSetItem(`${MEMBER_PROGRESS_PREFIX}${progress.memberId}`, JSON.stringify(progress));
  }

  static loadFamilyProgress(familyId: string): FamilyProgress | null {
    const raw = this.safeGetItem(`${FAMILY_PROGRESS_PREFIX}${familyId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  static saveFamilyProgress(progress: FamilyProgress): void {
    this.safeSetItem(`${FAMILY_PROGRESS_PREFIX}${progress.familyId}`, JSON.stringify(progress));
  }

  static loadSessionProgress(sessionId: string): SessionProgress | null {
    const raw = this.safeGetItem(`${SESSION_PROGRESS_PREFIX}${sessionId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  static saveSessionProgress(progress: SessionProgress): void {
    this.safeSetItem(`${SESSION_PROGRESS_PREFIX}${progress.sessionId}`, JSON.stringify(progress));
  }

  static logXPEvent(event: XPEvent, xpGained: number): void {
    const logs = this.getLogs();
    logs.unshift({ event, xpGained });
    // Keep last 100 entries to maintain memory efficiency
    const trimmed = logs.slice(0, 100);
    this.safeSetItem(LOGS_STORAGE_KEY, JSON.stringify(trimmed));
  }

  static getLogs(memberId?: string): XPLogEntry[] {
    const raw = this.safeGetItem(LOGS_STORAGE_KEY);
    if (!raw) return [];
    try {
      const logs: XPLogEntry[] = JSON.parse(raw);
      if (memberId) {
        return logs.filter((l) => l.event.memberId === memberId);
      }
      return logs;
    } catch (e) {
      return [];
    }
  }

  static clear(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('neonflow_progression_') || key === LOGS_STORAGE_KEY)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }
    } catch (e) {
      // Ignore
    }
  }
}
