import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Track } from '../types';
import { playerEngine } from '../core/player';
import { HistoryItem } from '../repositories/HistoryRepository';
import { useProfile } from './ProfileContext';
import { useSession } from './SessionContext';
import { useMediaSession } from '../hooks/useMediaSession';
import { progressionObserverBridge } from '../core/progression/ProgressionObserverBridge';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  queue: Track[];
  repeatMode: 'none' | 'all' | 'one';
  shuffleMode: boolean;
  playerReady: boolean;
  history: HistoryItem[];
  playTrack: (track: Track, newQueue?: Track[]) => void;
  pauseTrack: () => void;
  stopTrack: () => void;
  resumeTrack: () => void;
  togglePlay: () => void;
  setVolume: (v: number) => void;
  setProgress: (p: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  addToQueue: (track: Track) => void;
  addNextToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  clearQueue: () => void;
  setQueue: (queue: Track[]) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  registerPlayer: (player: any) => void;
  logCurrentTrackProgress: (timeListened: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeProfile } = useProfile();
  const { recordSongPlayInSession, updateSongProgressInSession } = useSession();

  // State synchronized with PlayerEngine
  const [currentTrack, setCurrentTrack] = useState<Track | null>(() => playerEngine.getCurrentTrack());
  const [isPlaying, setIsPlaying] = useState<boolean>(() => playerEngine.getIsPlaying());
  const [volume, setVolumeState] = useState<number>(() => playerEngine.getVolume());
  const [progress, setProgressState] = useState<number>(() => playerEngine.getCurrentTime());
  const [duration, setDurationState] = useState<number>(() => playerEngine.getDuration());
  const [queue, setQueueState] = useState<Track[]>(() => playerEngine.getQueue());
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>(() => playerEngine.getRepeatMode());
  const [shuffleMode, setShuffleMode] = useState<boolean>(() => playerEngine.getShuffleMode());
  const [playerReady, setPlayerReady] = useState<boolean>(() => playerEngine.isReady());
  const [history, setHistory] = useState<HistoryItem[]>(() => playerEngine.getHistory());

  const currentTrackRef = useRef<Track | null>(currentTrack);
  currentTrackRef.current = currentTrack;

  // Initialize Player Engine and subscribe to events
  useEffect(() => {
    playerEngine.init();
    progressionObserverBridge.init(activeProfile?.id || 'm-1');

    const unsubTrack = playerEngine.on('trackChange', (track: Track | null) => {
      setCurrentTrack(track);
    });

    const unsubPlayback = playerEngine.on('playbackStateChange', (playing: boolean) => {
      setIsPlaying(playing);
    });

    const unsubTime = playerEngine.on('timeUpdate', ({ currentTime, duration }: { currentTime: number; duration: number }) => {
      setProgressState(currentTime);
      if (duration > 0) {
        setDurationState(duration);
      }
      if (currentTrackRef.current) {
        updateSongProgressInSession(currentTrackRef.current.id, Math.floor(currentTime));
      }
    });

    const unsubVol = playerEngine.on('volumeChange', (vol: number) => {
      setVolumeState(vol);
    });

    const unsubQueue = playerEngine.on('queueChange', (q: Track[]) => {
      setQueueState(q);
    });

    const unsubRepeat = playerEngine.on('repeatChange', (rm: 'none' | 'all' | 'one') => {
      setRepeatMode(rm);
    });

    const unsubShuffle = playerEngine.on('shuffleChange', (shuf: boolean) => {
      setShuffleMode(shuf);
    });

    const unsubReady = playerEngine.on('playerReadyChange', (ready: boolean) => {
      setPlayerReady(ready);
    });

    const unsubHist = playerEngine.on('historyChange', (h: HistoryItem[]) => {
      setHistory(h);
    });

    return () => {
      unsubTrack();
      unsubPlayback();
      unsubTime();
      unsubVol();
      unsubQueue();
      unsubRepeat();
      unsubShuffle();
      unsubReady();
      unsubHist();
    };
  }, [updateSongProgressInSession]);

  // Actions delegating to PlayerEngine
  const playTrack = useCallback(
    (track: Track, newQueue?: Track[]) => {
      playerEngine.playTrack(track, newQueue);
      recordSongPlayInSession(track, activeProfile?.id);
    },
    [activeProfile?.id, recordSongPlayInSession]
  );

  const pauseTrack = useCallback(() => {
    playerEngine.pauseTrack();
  }, []);

  const stopTrack = useCallback(() => {
    playerEngine.stopTrack();
  }, []);

  const resumeTrack = useCallback(() => {
    playerEngine.resumeTrack();
  }, []);

  const togglePlay = useCallback(() => {
    playerEngine.togglePlay();
  }, []);

  const setVolume = useCallback((v: number) => {
    playerEngine.setVolume(v);
  }, []);

  const setProgress = useCallback((p: number) => {
    playerEngine.seekTo(p);
  }, []);

  const nextTrack = useCallback(() => {
    playerEngine.nextTrack();
  }, []);

  const prevTrack = useCallback(() => {
    playerEngine.prevTrack();
  }, []);

  // Sync Media Session API (lockscreen, Bluetooth hardware controls, metadata)
  useMediaSession({
    currentTrack,
    isPlaying,
    progress,
    duration,
    playNext: nextTrack,
    playPrev: prevTrack,
    togglePlay,
    seekTo: setProgress,
  });

  const addToQueue = useCallback((track: Track) => {
    playerEngine.addToQueue(track);
  }, []);

  const addNextToQueue = useCallback((track: Track) => {
    playerEngine.addNextToQueue(track);
  }, []);

  const removeFromQueue = useCallback((trackId: string) => {
    playerEngine.removeFromQueue(trackId);
  }, []);

  const reorderQueue = useCallback((startIndex: number, endIndex: number) => {
    playerEngine.reorderQueue(startIndex, endIndex);
  }, []);

  const clearQueue = useCallback(() => {
    playerEngine.clearQueue();
  }, []);

  const setQueue = useCallback((q: Track[]) => {
    playerEngine.setQueue(q);
  }, []);

  const toggleShuffle = useCallback(() => {
    playerEngine.toggleShuffle();
  }, []);

  const toggleRepeat = useCallback(() => {
    playerEngine.toggleRepeat();
  }, []);

  const registerPlayer = useCallback((_player: any) => {
    // Backwards compatibility stub; engine handles player registration
  }, []);

  const logCurrentTrackProgress = useCallback((timeListened: number) => {
    // Engine automatically tracks play history
  }, []);

  // Keyboard Shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (!currentTrack) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextTrack();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevTrack();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(volume + 5);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(volume - 5);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack, volume, togglePlay, nextTrack, prevTrack, setVolume]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        volume,
        progress,
        duration,
        queue,
        repeatMode,
        shuffleMode,
        playerReady,
        history,
        playTrack,
        pauseTrack,
        stopTrack,
        resumeTrack,
        togglePlay,
        setVolume,
        setProgress,
        nextTrack,
        prevTrack,
        addToQueue,
        addNextToQueue,
        removeFromQueue,
        reorderQueue,
        clearQueue,
        setQueue,
        toggleShuffle,
        toggleRepeat,
        registerPlayer,
        logCurrentTrackProgress,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
