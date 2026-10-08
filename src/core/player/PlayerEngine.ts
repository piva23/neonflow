import { Track } from '../../types';
import { playerEvents, PlayerEventType, EventCallback } from './PlayerEvents';
import { PlayerPersistence } from './PlayerPersistence';
import { playbackManager } from './PlaybackManager';
import { queueManager } from './QueueManager';
import { historyManager } from './HistoryManager';
import { PlaybackAdapterFactory } from './adapters';

export class PlayerEngine {
  private static instance: PlayerEngine | null = null;
  private isInitialized: boolean = false;
  private trackStartTime: number = 0;

  private constructor() {
    this.setupListeners();
  }

  public static getInstance(): PlayerEngine {
    if (!PlayerEngine.instance) {
      PlayerEngine.instance = new PlayerEngine();
    }
    return PlayerEngine.instance;
  }

  /**
   * Boot engine and restore state from persistence
   */
  public async init(containerId: string = 'neonflow-youtube-iframe-element'): Promise<void> {
    if (this.isInitialized) {
      return Promise.resolve();
    }

    const state = PlayerPersistence.loadState();

    queueManager.initFromPersistence(
      state.currentTrack,
      state.queue,
      state.repeatMode,
      state.shuffleMode
    );

    playbackManager.initFromPersistence(state.volume, state.currentTime);

    this.isInitialized = true;

    // Initialize default YouTube bridge adapter for iframe container
    const defaultAdapter = PlaybackAdapterFactory.getAdapterByType('youtube');
    await defaultAdapter.init(containerId);

    if (state.currentTrack) {
      if (state.isPlaying) {
        await playbackManager.playTrack(state.currentTrack, state.currentTime);
      } else {
        await playbackManager.preloadTrack(state.currentTrack, state.currentTime);
      }
    }
  }

  private setupListeners(): void {
    // When track ends automatically in adapter
    playerEvents.on('trackEnded', () => {
      this.recordHistoryForCurrentTrack();
      this.nextTrack();
    });
  }

  private recordHistoryForCurrentTrack(): void {
    const current = queueManager.getCurrentTrack();
    if (current && this.trackStartTime > 0) {
      const durationListened = Math.floor((Date.now() - this.trackStartTime) / 1000);
      if (durationListened > 5) {
        historyManager.recordTrackPlay(current, durationListened);
      }
    }
  }

  // ================= STATE GETTERS =================

  public getCurrentTrack(): Track | null {
    return queueManager.getCurrentTrack();
  }

  public getIsPlaying(): boolean {
    return playbackManager.getIsPlaying();
  }

  public getCurrentTime(): number {
    return playbackManager.getCurrentTime();
  }

  public getDuration(): number {
    return playbackManager.getDuration();
  }

  public getVolume(): number {
    return playbackManager.getVolume();
  }

  public getQueue(): Track[] {
    return queueManager.getQueue();
  }

  public getRepeatMode(): 'none' | 'all' | 'one' {
    return queueManager.getRepeatMode();
  }

  public getShuffleMode(): boolean {
    return queueManager.getShuffleMode();
  }

  public getHistory() {
    return historyManager.getHistory();
  }

  public isReady(): boolean {
    return playbackManager.getActiveAdapter().isReady();
  }

  // ================= PLAYBACK CONTROLS =================

  public playTrack(track: Track, newQueue?: Track[]): void {
    this.recordHistoryForCurrentTrack();

    queueManager.playTrack(track, newQueue);
    this.trackStartTime = Date.now();

    // High level clean call through PlaybackManager & Adapter pattern
    playbackManager.playTrack(track, 0);
  }

  public pauseTrack(): void {
    playbackManager.pause();
  }

  public stopTrack(): void {
    playbackManager.stop();
    queueManager.setCurrentTrack(null);
    PlayerPersistence.saveState({ currentTrack: null, isPlaying: false, currentTime: 0 });
  }

  public resumeTrack(): void {
    const current = queueManager.getCurrentTrack();
    if (!current) return;

    if (!playbackManager.getIsPlaying()) {
      playbackManager.resume();
    }
  }

  public togglePlay(): void {
    const current = queueManager.getCurrentTrack();
    if (!current) return;

    playbackManager.togglePlay();
  }

  public nextTrack(): void {
    this.recordHistoryForCurrentTrack();

    const next = queueManager.getNextTrack();
    if (next) {
      this.playTrack(next);
    } else {
      playbackManager.pause();
    }
  }

  public prevTrack(): void {
    if (playbackManager.getCurrentTime() > 4) {
      playbackManager.seekTo(0);
      return;
    }

    this.recordHistoryForCurrentTrack();

    const prev = queueManager.getPrevTrack();
    if (prev) {
      this.playTrack(prev);
    } else {
      playbackManager.seekTo(0);
    }
  }

  public seekTo(seconds: number): void {
    playbackManager.seekTo(seconds);
  }

  public setVolume(volume: number): void {
    playbackManager.setVolume(volume);
  }

  // ================= QUEUE CONTROLS =================

  public addToQueue(track: Track): void {
    queueManager.addToQueue(track);
  }

  public addNextToQueue(track: Track): void {
    queueManager.addNextToQueue(track);
  }

  public removeFromQueue(trackId: string): void {
    queueManager.removeFromQueue(trackId);
  }

  public reorderQueue(startIndex: number, endIndex: number): void {
    queueManager.reorderQueue(startIndex, endIndex);
  }

  public clearQueue(): void {
    queueManager.clearQueue();
  }

  public setQueue(queue: Track[]): void {
    queueManager.setQueue(queue);
  }

  public toggleShuffle(): boolean {
    return queueManager.toggleShuffle();
  }

  public toggleRepeat(): 'none' | 'all' | 'one' {
    return queueManager.toggleRepeat();
  }

  // ================= CASCADE HANDLERS =================

  /**
   * Called when a track is deleted from the library.
   * Removes from queue and advances if currently playing.
   */
  public handleTrackDeleted(deletedTrackId: string): void {
    historyManager.removeTrackFromHistory(deletedTrackId);

    const isCurrentDeleted = this.getCurrentTrack()?.id === deletedTrackId;
    const nextTrackToPlay = queueManager.handleTrackDeleted(deletedTrackId);

    if (isCurrentDeleted) {
      if (nextTrackToPlay) {
        this.playTrack(nextTrackToPlay);
      } else {
        playbackManager.stop();
      }
    }
  }

  /**
   * Called when a track is updated in the library.
   * If it's the current track, sync state in queue & engine.
   */
  public handleTrackUpdated(updatedTrack: Track): void {
    const current = this.getCurrentTrack();

    // Update in queue list
    const currentQueue = this.getQueue();
    const indexInQueue = currentQueue.findIndex((t) => t.id === updatedTrack.id);
    if (indexInQueue !== -1) {
      const newQueue = [...currentQueue];
      newQueue[indexInQueue] = updatedTrack;
      queueManager.setQueue(newQueue);
    }

    if (current && current.id === updatedTrack.id) {
      queueManager.setCurrentTrack(updatedTrack);
      if (
        current.youtubeId !== updatedTrack.youtubeId ||
        current.source?.localPath !== updatedTrack.source?.localPath
      ) {
        if (playbackManager.getIsPlaying()) {
          playbackManager.playTrack(updatedTrack, playbackManager.getCurrentTime());
        }
      }
    }
  }

  // ================= EVENTS SUBSCRIPTION =================

  public on(event: PlayerEventType, callback: EventCallback): () => void {
    return playerEvents.on(event, callback);
  }
}

export const playerEngine = PlayerEngine.getInstance();
