import { Track } from '../../../types';
import { PlaybackAdapter, PlaybackSourceType } from './PlaybackAdapter';
import { youtubeBridge } from '../YouTubeBridge';

export class YouTubePlaybackAdapter implements PlaybackAdapter {
  readonly sourceType: PlaybackSourceType = 'youtube';

  public init(containerId?: string): Promise<void> {
    return youtubeBridge.init(containerId);
  }

  public load(track: Track, startSeconds: number = 0): Promise<void> {
    if (!track.youtubeId) {
      console.warn('[YouTubePlaybackAdapter] Cannot load track missing youtubeId:', track);
      return Promise.resolve();
    }
    youtubeBridge.loadVideoById(track.youtubeId, startSeconds);
    return Promise.resolve();
  }

  public play(): void {
    youtubeBridge.playVideo();
  }

  public pause(): void {
    youtubeBridge.pauseVideo();
  }

  public seek(seconds: number): void {
    youtubeBridge.seekTo(seconds);
  }

  public stop(): void {
    youtubeBridge.stopVideo();
  }

  public setVolume(volume: number): void {
    youtubeBridge.setVolume(volume);
  }

  public getCurrentTime(): number {
    return youtubeBridge.getCurrentTime();
  }

  public getDuration(): number {
    return youtubeBridge.getDuration();
  }

  public isReady(): boolean {
    return youtubeBridge.isReady();
  }

  public destroy(): void {
    youtubeBridge.stopVideo();
  }
}

export const youtubePlaybackAdapter = new YouTubePlaybackAdapter();
