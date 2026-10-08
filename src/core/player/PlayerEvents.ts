import { Track } from '../../types';
import { HistoryItem } from '../../repositories/HistoryRepository';

export type PlayerEventType =
  | 'trackChange'
  | 'playbackStateChange'
  | 'timeUpdate'
  | 'volumeChange'
  | 'queueChange'
  | 'historyChange'
  | 'repeatChange'
  | 'shuffleChange'
  | 'playerReadyChange'
  | 'trackEnded'
  | 'error';

export type EventCallback = (data: any) => void;

export class PlayerEvents {
  private listeners: Map<PlayerEventType, Set<EventCallback>> = new Map();

  on(event: PlayerEventType, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off(event: PlayerEventType, callback: EventCallback): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  emit(event: PlayerEventType, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[PlayerEvents] Error in listener for "${event}":`, err);
        }
      });
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const playerEvents = new PlayerEvents();
