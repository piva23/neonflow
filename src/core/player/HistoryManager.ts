import { Track } from '../../types';
import { HistoryRepository, HistoryItem } from '../../repositories/HistoryRepository';
import { playerEvents } from './PlayerEvents';

export class HistoryManager {
  private history: HistoryItem[] = [];

  constructor() {
    this.history = HistoryRepository.getHistory();
  }

  public getHistory(): HistoryItem[] {
    return this.history;
  }

  public recordTrackPlay(
    track: Track,
    durationListened: number = 0,
    profileId?: string,
    profileName?: string
  ): HistoryItem {
    const newItem = HistoryRepository.addHistoryItem({
      trackId: track.id,
      title: track.title,
      artist: track.artist,
      thumbnail: track.thumbnail,
      durationListened: Math.floor(durationListened),
      profileId,
      profileName,
    });

    this.history = HistoryRepository.getHistory();
    playerEvents.emit('historyChange', this.history);
    return newItem;
  }

  public clearHistory(): void {
    HistoryRepository.clearHistory();
    this.history = [];
    playerEvents.emit('historyChange', []);
  }

  public removeTrackFromHistory(trackId: string): void {
    HistoryRepository.removeByTrackId(trackId);
    this.history = HistoryRepository.getHistory();
    playerEvents.emit('historyChange', this.history);
  }
}

export const historyManager = new HistoryManager();
