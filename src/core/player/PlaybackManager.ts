import { Track } from '../../types';
import { playerEvents } from './PlayerEvents';
import { PlayerPersistence } from './PlayerPersistence';
import { PlaybackAdapter, PlaybackAdapterFactory } from './adapters';

export class PlaybackManager {
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private duration: number = 0;
  private volume: number = 80;
  private ticker: any = null;
  private activeAdapter: PlaybackAdapter = PlaybackAdapterFactory.getAdapterByType('local');

  constructor() {
    // Listen for player ready to apply volume
    playerEvents.on('playerReadyChange', (ready) => {
      if (ready) {
        this.activeAdapter.setVolume(this.volume);
      }
    });

    // Listen for ended event to stop ticker
    playerEvents.on('trackEnded', () => {
      this.isPlaying = false;
      this.stopTicker();
      playerEvents.emit('playbackStateChange', false);
      PlayerPersistence.saveState({ isPlaying: false });
    });
  }

  public initFromPersistence(initialVolume: number, initialTime: number = 0): void {
    this.volume = initialVolume;
    this.currentTime = initialTime;
  }

  public getActiveAdapter(): PlaybackAdapter {
    return this.activeAdapter;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getDuration(): number {
    return this.duration;
  }

  public getVolume(): number {
    return this.volume;
  }

  public async playTrack(track: Track, startSeconds: number = 0): Promise<void> {
    this.currentTime = startSeconds;

    const targetAdapter = PlaybackAdapterFactory.getAdapterForTrack(track);

    if (this.activeAdapter !== targetAdapter) {
      this.activeAdapter.stop();
      this.activeAdapter = targetAdapter;
    }

    await this.activeAdapter.init();
    await this.activeAdapter.load(track, startSeconds);
    await this.activeAdapter.play();

    this.isPlaying = true;
    playerEvents.emit('playbackStateChange', true);
    this.startTicker();
    PlayerPersistence.saveState({ isPlaying: true, currentTime: startSeconds });
  }

  public async preloadTrack(track: Track, startSeconds: number = 0): Promise<void> {
    const targetAdapter = PlaybackAdapterFactory.getAdapterForTrack(track);

    if (this.activeAdapter !== targetAdapter) {
      this.activeAdapter.stop();
      this.activeAdapter = targetAdapter;
    }

    await this.activeAdapter.init();
    await this.activeAdapter.load(track, startSeconds);
    this.activeAdapter.pause();
  }

  public resume(): void {
    this.activeAdapter.play();
    this.isPlaying = true;
    playerEvents.emit('playbackStateChange', true);
    this.startTicker();
    PlayerPersistence.saveState({ isPlaying: true });
  }

  public pause(): void {
    this.activeAdapter.pause();
    this.isPlaying = false;
    playerEvents.emit('playbackStateChange', false);
    this.stopTicker();
    PlayerPersistence.saveState({ isPlaying: false, currentTime: this.currentTime });
  }

  public stop(): void {
    this.activeAdapter.stop();
    this.isPlaying = false;
    playerEvents.emit('playbackStateChange', false);
    this.stopTicker();
  }

  public togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.resume();
    }
  }

  public seekTo(seconds: number): void {
    this.currentTime = seconds;
    this.activeAdapter.seek(seconds);
    playerEvents.emit('timeUpdate', { currentTime: this.currentTime, duration: this.duration });
    PlayerPersistence.saveState({ currentTime: this.currentTime });
  }

  public setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(100, volume));
    this.volume = clamped;
    this.activeAdapter.setVolume(clamped);
    playerEvents.emit('volumeChange', clamped);
    PlayerPersistence.saveState({ volume: clamped });
  }

  private startTicker(): void {
    this.stopTicker();
    this.ticker = setInterval(() => {
      if (!this.isPlaying) return;

      const time = this.activeAdapter.getCurrentTime();
      const dur = this.activeAdapter.getDuration();

      if (time > 0) {
        this.currentTime = time;
      }
      if (dur > 0 && dur !== this.duration) {
        this.duration = dur;
      }

      playerEvents.emit('timeUpdate', { currentTime: this.currentTime, duration: this.duration });

      if (Math.floor(this.currentTime) % 3 === 0) {
        PlayerPersistence.saveState({ currentTime: this.currentTime });
      }
    }, 500);
  }

  private stopTicker(): void {
    if (this.ticker) {
      clearInterval(this.ticker);
      this.ticker = null;
    }
  }
}

export const playbackManager = new PlaybackManager();
