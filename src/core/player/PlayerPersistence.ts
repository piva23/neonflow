import { Track } from '../../types';
import { StorageRepository } from '../../repositories/StorageRepository';

const KEYS = {
  CURRENT_TRACK: 'player_current_track',
  CURRENT_TIME: 'player_current_time',
  QUEUE: 'player_queue',
  VOLUME: 'player_volume',
  REPEAT_MODE: 'player_repeat_mode',
  SHUFFLE_MODE: 'player_shuffle_mode',
  IS_PLAYING: 'player_is_playing',
};

export interface PersistedPlayerState {
  currentTrack: Track | null;
  currentTime: number;
  queue: Track[];
  volume: number;
  repeatMode: 'none' | 'all' | 'one';
  shuffleMode: boolean;
  isPlaying: boolean;
}

export class PlayerPersistence {
  static saveState(state: Partial<PersistedPlayerState>): void {
    if (state.currentTrack !== undefined) {
      StorageRepository.set(KEYS.CURRENT_TRACK, state.currentTrack);
    }
    if (state.currentTime !== undefined) {
      StorageRepository.set(KEYS.CURRENT_TIME, Math.floor(state.currentTime));
    }
    if (state.queue !== undefined) {
      StorageRepository.set(KEYS.QUEUE, state.queue);
    }
    if (state.volume !== undefined) {
      StorageRepository.set(KEYS.VOLUME, state.volume);
    }
    if (state.repeatMode !== undefined) {
      StorageRepository.set(KEYS.REPEAT_MODE, state.repeatMode);
    }
    if (state.shuffleMode !== undefined) {
      StorageRepository.set(KEYS.SHUFFLE_MODE, state.shuffleMode);
    }
    if (state.isPlaying !== undefined) {
      StorageRepository.set(KEYS.IS_PLAYING, state.isPlaying);
    }
  }

  static loadState(): PersistedPlayerState {
    return {
      currentTrack: StorageRepository.get<Track | null>(KEYS.CURRENT_TRACK, null),
      currentTime: StorageRepository.get<number>(KEYS.CURRENT_TIME, 0),
      queue: StorageRepository.get<Track[]>(KEYS.QUEUE, []),
      volume: StorageRepository.get<number>(KEYS.VOLUME, 80),
      repeatMode: StorageRepository.get<'none' | 'all' | 'one'>(KEYS.REPEAT_MODE, 'none'),
      shuffleMode: StorageRepository.get<boolean>(KEYS.SHUFFLE_MODE, false),
      isPlaying: false, // Default to paused when reloading app for smooth audio compliance
    };
  }
}
