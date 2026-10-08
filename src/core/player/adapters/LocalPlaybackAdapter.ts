import { Track } from '../../../types';
import { PlaybackAdapter, PlaybackSourceType } from './PlaybackAdapter';
import { playerEvents } from '../PlayerEvents';
import { mediaCache, mediaStorage } from '../../media';
import { LocalSynthesizerProvider } from '../../download/providers/LocalSynthesizerProvider';

export class LocalPlaybackAdapter implements PlaybackAdapter {
  readonly sourceType: PlaybackSourceType = 'local';
  private audioElement: HTMLAudioElement | null = null;
  private isAudioReady: boolean = false;
  private currentTrack: Track | null = null;

  public init(): Promise<void> {
    if (typeof window === 'undefined') {
      return Promise.resolve();
    }

    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.preload = 'auto';

      this.audioElement.addEventListener('canplay', () => {
        this.isAudioReady = true;
        playerEvents.emit('playerReadyChange', true);
      });

      this.audioElement.addEventListener('play', () => {
        playerEvents.emit('playbackStateChange', true);
      });

      this.audioElement.addEventListener('pause', () => {
        playerEvents.emit('playbackStateChange', false);
      });

      this.audioElement.addEventListener('ended', () => {
        playerEvents.emit('playbackStateChange', false);
        playerEvents.emit('trackEnded');
      });

      this.audioElement.addEventListener('error', (e) => {
        console.error('[LocalPlaybackAdapter] HTMLAudioElement error:', e);
        playerEvents.emit('error', e);
      });
    }

    this.isAudioReady = true;
    return Promise.resolve();
  }

  public async load(track: Track, startSeconds: number = 0): Promise<void> {
    await this.init();
    if (!this.audioElement) return;

    this.currentTrack = track;

    // Resolve media URI:
    // 1. Local path (e.g., blob URL or local filesystem path)
    // 2. Local fallback audio / synthetic media source for offline testing
    const mediaUri = await this.resolveMediaUri(track);

    if (mediaUri) {
      this.audioElement.src = mediaUri;
      this.audioElement.currentTime = startSeconds;
      this.audioElement.load();
    } else {
      console.warn('[LocalPlaybackAdapter] No valid media URI resolved for track:', track.title);
    }
  }

  public async play(): Promise<void> {
    if (this.audioElement) {
      try {
        await this.audioElement.play();
      } catch (err) {
        console.error('[LocalPlaybackAdapter] Error in play():', err);
      }
    }
  }

  public pause(): void {
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  public seek(seconds: number): void {
    if (this.audioElement) {
      this.audioElement.currentTime = seconds;
    }
  }

  public stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
  }

  public setVolume(volume: number): void {
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, volume / 100));
    }
  }

  public getCurrentTime(): number {
    return this.audioElement?.currentTime || 0;
  }

  public getDuration(): number {
    return this.audioElement?.duration || this.currentTrack?.duration || 0;
  }

  public isReady(): boolean {
    return this.isAudioReady && Boolean(this.audioElement);
  }

  public destroy(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }
  }

  /**
   * Resolves local audio Blob URL from Memory Cache, IndexedDB, or generates on-the-fly local audio
   */
  private async resolveMediaUri(track: Track): Promise<string | null> {
    // 1. Memory object URL or direct local blob URL
    if (track.source?.localPath && track.source.localPath.startsWith('blob:')) {
      return track.source.localPath;
    }

    // 2. Memory cache lookup
    const cachedUrl = mediaCache.getObjectUrlForTrack(track.id);
    if (cachedUrl) {
      return cachedUrl;
    }

    // 3. IndexedDB record lookup
    try {
      const record = await mediaStorage.getRecordByTrackId(track.id);
      if (record && record.fileBlob && record.fileBlob.size > 0) {
        const objectUrl = URL.createObjectURL(record.fileBlob);
        mediaCache.registerObjectUrl(track.id, objectUrl);
        return objectUrl;
      }
    } catch (err) {
      console.warn('[LocalPlaybackAdapter] IndexedDB lookup error for track:', track.id, err);
    }

    // 4. Generate local high-quality synthetic WebAudio stream on-the-fly & store in IndexedDB
    try {
      console.log('[LocalPlaybackAdapter] Auto-generating local audio blob for track:', track.title);
      const synth = new LocalSynthesizerProvider();
      const audioBlob = await synth.startDownload(track);
      const objectUrl = URL.createObjectURL(audioBlob);
      mediaCache.registerObjectUrl(track.id, objectUrl);

      // Save to IndexedDB so it's permanently stored locally
      await mediaStorage.saveRecord({
        id: `rec_offline_${track.id}`,
        trackId: track.id,
        blobId: `blob_${Date.now()}`,
        fileBlob: audioBlob,
        fileName: `${track.artist} - ${track.title}.mp3`,
        size: audioBlob.size,
        duration: track.duration || 180,
        mimeType: 'audio/mpeg',
        quality: '320kbps Local',
        createdAt: Date.now(),
        lastPlayed: Date.now(),
        favorite: track.favorite || false,
        downloads: 1,
        checksum: `chk_${track.id}`,
      });

      return objectUrl;
    } catch (err) {
      console.error('[LocalPlaybackAdapter] Error generating local audio blob:', err);
      return null;
    }
  }

  private async lookupIndexedDBCache(trackId: string): Promise<string | null> {
    return mediaCache.getObjectUrlForTrack(trackId);
  }

}

export const localPlaybackAdapter = new LocalPlaybackAdapter();
