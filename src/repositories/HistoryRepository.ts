import { StorageRepository } from './StorageRepository';

export interface HistoryItem {
  id: string;
  trackId: string;
  title: string;
  artist: string;
  thumbnail?: string;
  playedAt: string; // ISO string
  durationListened: number; // in seconds
  profileId?: string;
  profileName?: string;
}

const HISTORY_KEY = 'player_history';

export class HistoryRepository {
  static getHistory(): HistoryItem[] {
    return StorageRepository.get<HistoryItem[]>(HISTORY_KEY, []);
  }

  static saveHistory(history: HistoryItem[]): void {
    StorageRepository.set<HistoryItem[]>(HISTORY_KEY, history);
  }

  static addHistoryItem(item: Omit<HistoryItem, 'id' | 'playedAt'>): HistoryItem {
    const history = this.getHistory();
    const newItem: HistoryItem = {
      ...item,
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      playedAt: new Date().toISOString(),
    };

    // Keep max 100 history entries
    const updated = [newItem, ...history].slice(0, 100);
    this.saveHistory(updated);
    return newItem;
  }

  static clearHistory(): void {
    StorageRepository.set<HistoryItem[]>(HISTORY_KEY, []);
  }

  static removeByTrackId(trackId: string): void {
    const history = this.getHistory();
    const updated = history.filter((item) => item.trackId !== trackId);
    this.saveHistory(updated);
  }
}
