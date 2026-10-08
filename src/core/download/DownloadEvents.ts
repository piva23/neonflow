import { DownloadTask } from './DownloadTypes';
import { Track } from '../../types';

export type DownloadEventType =
  | 'DOWNLOAD_STARTED'
  | 'DOWNLOAD_PROGRESS'
  | 'DOWNLOAD_COMPLETED'
  | 'DOWNLOAD_FAILED'
  | 'DOWNLOAD_CANCELLED'
  | 'OFFLINE_AVAILABLE';

export type DownloadEventCallback = (data: {
  task?: DownloadTask;
  track?: Track;
  trackId?: string;
  error?: string;
  progress?: number;
}) => void;

export class DownloadEvents {
  private listeners: Map<DownloadEventType, Set<DownloadEventCallback>> = new Map();

  on(event: DownloadEventType, callback: DownloadEventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: DownloadEventType, callback: DownloadEventCallback): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  emit(
    event: DownloadEventType,
    data: {
      task?: DownloadTask;
      track?: Track;
      trackId?: string;
      error?: string;
      progress?: number;
    }
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[DownloadEvents] Error in event listener for "${event}":`, err);
        }
      });
    }
  }
}

export const downloadEvents = new DownloadEvents();
