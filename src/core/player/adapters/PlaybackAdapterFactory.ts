import { Track } from '../../../types';
import { PlaybackAdapter, PlaybackSourceType } from './PlaybackAdapter';
import { localPlaybackAdapter } from './LocalPlaybackAdapter';

export class PlaybackAdapterFactory {
  /**
   * Always return localPlaybackAdapter to ensure direct local MP3/audio playback
   * without YouTube iframe streaming.
   */
  public static getAdapterForTrack(_track?: Track | null): PlaybackAdapter {
    return localPlaybackAdapter;
  }

  /**
   * Get adapter directly by type ('local')
   */
  public static getAdapterByType(_type: PlaybackSourceType): PlaybackAdapter {
    return localPlaybackAdapter;
  }
}

