import { TrackStory, TimelineEvent, MemberFavoriteMemory } from './types';

const TRACK_STORY_PREFIX = 'neonflow_memory_story_';
const TIMELINE_PREFIX = 'neonflow_memory_timeline_';
const MEMBER_FAVORITES_KEY = 'neonflow_memory_member_favorites';
const DAY_TRACKER_PREFIX = 'neonflow_memory_day_';
const MONTH_TRACKER_PREFIX = 'neonflow_memory_month_';

export class MemoriesStorage {
  private static safeGetItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      // Ignore storage errors
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

  // ================= TRACK STORIES =================

  static loadTrackStory(trackId: string): TrackStory | null {
    const raw = this.safeGetItem(`${TRACK_STORY_PREFIX}${trackId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  static saveTrackStory(story: TrackStory): void {
    this.safeSetItem(`${TRACK_STORY_PREFIX}${story.trackId}`, JSON.stringify(story));
  }

  static loadAllTrackStories(): TrackStory[] {
    const stories: TrackStory[] = [];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(TRACK_STORY_PREFIX)) {
            const raw = localStorage.getItem(key);
            if (raw) {
              try {
                stories.push(JSON.parse(raw));
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (e) {
      // Ignore errors
    }
    return stories;
  }

  // ================= TIMELINE EVENTS =================

  static loadTimelineEvents(familyId: string = 'f-1'): TimelineEvent[] {
    const raw = this.safeGetItem(`${TIMELINE_PREFIX}${familyId}`);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  static saveTimelineEvents(familyId: string = 'f-1', events: TimelineEvent[]): void {
    this.safeSetItem(`${TIMELINE_PREFIX}${familyId}`, JSON.stringify(events));
  }

  static addTimelineEvent(familyId: string = 'f-1', event: TimelineEvent): void {
    const events = this.loadTimelineEvents(familyId);
    // Prevent duplicate exact same event within 5 minutes
    const isDuplicate = events.some(
      (e) =>
        e.eventType === event.eventType &&
        e.trackId === event.trackId &&
        e.memberId === event.memberId &&
        Math.abs(e.timestamp - event.timestamp) < 300000
    );
    if (!isDuplicate) {
      events.unshift(event);
      // Keep up to 500 timeline events
      this.saveTimelineEvents(familyId, events.slice(0, 500));
    }
  }

  // ================= MEMBER FAVORITES =================

  static loadMemberFavorites(): Record<string, MemberFavoriteMemory> {
    const raw = this.safeGetItem(MEMBER_FAVORITES_KEY);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }

  static saveMemberFavorite(favorite: MemberFavoriteMemory): void {
    const favorites = this.loadMemberFavorites();
    favorites[favorite.memberId] = favorite;
    this.safeSetItem(MEMBER_FAVORITES_KEY, JSON.stringify(favorites));
  }

  // ================= DAY & MONTH TRACKERS =================

  static getDayTracker(dateKey: string): { firstTrackId?: string; lastTrackId?: string; lastEventId?: string } | null {
    const raw = this.safeGetItem(`${DAY_TRACKER_PREFIX}${dateKey}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  static setDayTracker(
    dateKey: string,
    tracker: { firstTrackId?: string; lastTrackId?: string; lastEventId?: string }
  ): void {
    this.safeSetItem(`${DAY_TRACKER_PREFIX}${dateKey}`, JSON.stringify(tracker));
  }

  static getMonthTracker(monthKey: string): { firstTrackId?: string } | null {
    const raw = this.safeGetItem(`${MONTH_TRACKER_PREFIX}${monthKey}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  static setMonthTracker(monthKey: string, tracker: { firstTrackId?: string }): void {
    this.safeSetItem(`${MONTH_TRACKER_PREFIX}${monthKey}`, JSON.stringify(tracker));
  }

  // ================= CLEAR =================

  static clearAllMemories(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            (key.startsWith(TRACK_STORY_PREFIX) ||
              key.startsWith(TIMELINE_PREFIX) ||
              key === MEMBER_FAVORITES_KEY ||
              key.startsWith(DAY_TRACKER_PREFIX) ||
              key.startsWith(MONTH_TRACKER_PREFIX))
          ) {
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
