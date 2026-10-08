import { Track } from '../../types';
import { playerEvents } from './PlayerEvents';
import { PlayerPersistence } from './PlayerPersistence';

export class QueueManager {
  private currentTrack: Track | null = null;
  private queue: Track[] = [];
  private originalQueue: Track[] = []; // Used for un-shuffling
  private repeatMode: 'none' | 'all' | 'one' = 'none';
  private shuffleMode: boolean = false;

  constructor() {}

  public initFromPersistence(
    initialTrack: Track | null,
    initialQueue: Track[],
    repeatMode: 'none' | 'all' | 'one',
    shuffleMode: boolean
  ): void {
    this.currentTrack = initialTrack;
    this.queue = initialQueue;
    this.originalQueue = [...initialQueue];
    this.repeatMode = repeatMode;
    this.shuffleMode = shuffleMode;
  }

  public getCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  public getQueue(): Track[] {
    return this.queue;
  }

  public getRepeatMode(): 'none' | 'all' | 'one' {
    return this.repeatMode;
  }

  public getShuffleMode(): boolean {
    return this.shuffleMode;
  }

  public setCurrentTrack(track: Track | null): void {
    this.currentTrack = track;
    playerEvents.emit('trackChange', track);
    PlayerPersistence.saveState({ currentTrack: track });
  }

  public setQueue(newQueue: Track[]): void {
    this.queue = newQueue;
    this.originalQueue = [...newQueue];
    playerEvents.emit('queueChange', this.queue);
    PlayerPersistence.saveState({ queue: this.queue });
  }

  public playTrack(track: Track, newQueue?: Track[]): void {
    this.currentTrack = track;

    if (newQueue && newQueue.length > 0) {
      this.setQueue(newQueue);
    } else {
      // Ensure track is in the queue if not already present
      if (!this.queue.some((t) => t.id === track.id)) {
        this.setQueue([track, ...this.queue]);
      }
    }

    playerEvents.emit('trackChange', this.currentTrack);
    PlayerPersistence.saveState({ currentTrack: this.currentTrack });
  }

  public addToQueue(track: Track): void {
    if (this.queue.some((t) => t.id === track.id)) return; // Prevent duplicates in queue
    const updated = [...this.queue, track];
    this.setQueue(updated);
  }

  public addNextToQueue(track: Track): void {
    if (!this.currentTrack) {
      this.playTrack(track);
      return;
    }
    const currentIndex = this.queue.findIndex((t) => t.id === this.currentTrack?.id);
    const updated = [...this.queue];
    const existingIndex = updated.findIndex((t) => t.id === track.id);
    if (existingIndex !== -1) {
      updated.splice(existingIndex, 1);
    }
    const insertPos = currentIndex !== -1 ? currentIndex + 1 : updated.length;
    updated.splice(insertPos, 0, track);
    this.setQueue(updated);
  }

  public removeFromQueue(trackId: string): void {
    const updated = this.queue.filter((t) => t.id !== trackId);
    this.setQueue(updated);
  }

  public handleTrackDeleted(deletedTrackId: string): Track | null {
    const isCurrent = this.currentTrack?.id === deletedTrackId;
    let nextTrack: Track | null = null;

    if (isCurrent) {
      const currentIndex = this.queue.findIndex((t) => t.id === deletedTrackId);
      if (currentIndex !== -1 && currentIndex < this.queue.length - 1) {
        nextTrack = this.queue[currentIndex + 1];
      } else if (this.repeatMode === 'all' && this.queue.length > 1) {
        nextTrack = this.queue.find((t) => t.id !== deletedTrackId) || null;
      }
    }

    // Always remove from queue
    this.removeFromQueue(deletedTrackId);

    if (isCurrent) {
      this.setCurrentTrack(nextTrack);
      return nextTrack;
    }

    return this.currentTrack;
  }

  public reorderQueue(startIndex: number, endIndex: number): void {
    const result = Array.from(this.queue);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    this.setQueue(result);
  }

  public clearQueue(): void {
    this.setQueue([]);
  }

  public toggleShuffle(): boolean {
    const newShuffle = !this.shuffleMode;
    this.shuffleMode = newShuffle;

    if (newShuffle) {
      // Save original order and shuffle
      this.originalQueue = [...this.queue];
      const shuffled = [...this.queue].sort(() => Math.random() - 0.5);
      this.queue = shuffled;
    } else {
      // Restore original order
      this.queue = [...this.originalQueue];
    }

    playerEvents.emit('shuffleChange', this.shuffleMode);
    playerEvents.emit('queueChange', this.queue);
    PlayerPersistence.saveState({ shuffleMode: this.shuffleMode, queue: this.queue });
    return this.shuffleMode;
  }

  public toggleRepeat(): 'none' | 'all' | 'one' {
    const modes: ('none' | 'all' | 'one')[] = ['none', 'all', 'one'];
    const nextIndex = (modes.indexOf(this.repeatMode) + 1) % modes.length;
    this.repeatMode = modes[nextIndex];

    playerEvents.emit('repeatChange', this.repeatMode);
    PlayerPersistence.saveState({ repeatMode: this.repeatMode });
    return this.repeatMode;
  }

  public getNextTrack(): Track | null {
    if (!this.queue || this.queue.length === 0) return null;

    if (this.repeatMode === 'one' && this.currentTrack) {
      return this.currentTrack;
    }

    if (!this.currentTrack) return this.queue[0];

    const currentIndex = this.queue.findIndex((t) => t.id === this.currentTrack?.id);

    if (currentIndex === -1 || currentIndex === this.queue.length - 1) {
      if (this.repeatMode === 'all') {
        return this.queue[0];
      }
      return null;
    }

    return this.queue[currentIndex + 1];
  }

  public getPrevTrack(): Track | null {
    if (!this.queue || this.queue.length === 0) return null;
    if (!this.currentTrack) return this.queue[0];

    const currentIndex = this.queue.findIndex((t) => t.id === this.currentTrack?.id);

    if (currentIndex <= 0) {
      if (this.repeatMode === 'all') {
        return this.queue[this.queue.length - 1];
      }
      return this.queue[0];
    }

    return this.queue[currentIndex - 1];
  }
}

export const queueManager = new QueueManager();
