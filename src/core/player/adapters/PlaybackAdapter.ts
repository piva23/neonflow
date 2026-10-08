import { Track } from '../../../types';

export type PlaybackSourceType = 'youtube' | 'local';

export interface PlaybackAdapter {
  readonly sourceType: PlaybackSourceType;

  init(containerId?: string): Promise<void>;
  load(track: Track, startSeconds?: number): Promise<void>;
  play(): Promise<void> | void;
  pause(): void;
  seek(seconds: number): void;
  stop(): void;
  setVolume(volume: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  isReady(): boolean;
  destroy(): void;
}
