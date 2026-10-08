import { useEffect } from 'react';
import { Track } from '../types';

interface UseMediaSessionProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  playNext: () => void;
  playPrev: () => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
}

export function useMediaSession({
  currentTrack,
  isPlaying,
  progress,
  duration,
  playNext,
  playPrev,
  togglePlay,
  seekTo,
}: UseMediaSessionProps) {
  // Sync Media Metadata
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !currentTrack) {
      return;
    }

    const thumbnailUrl =
      currentTrack.thumbnail ||
      (currentTrack.youtubeId ? `https://img.youtube.com/vi/${currentTrack.youtubeId}/hqdefault.jpg` : '');

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist || 'NeonFlow',
      album: currentTrack.album || 'NeonFlow Family',
      artwork: [
        { src: thumbnailUrl, sizes: '96x96', type: 'image/jpeg' },
        { src: thumbnailUrl, sizes: '128x128', type: 'image/jpeg' },
        { src: thumbnailUrl, sizes: '192x192', type: 'image/jpeg' },
        { src: thumbnailUrl, sizes: '512x512', type: 'image/jpeg' },
      ],
    });
  }, [currentTrack]);

  // Sync Playback State
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch (e) {
      // Ignore
    }
  }, [isPlaying]);

  // Sync Position State
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    if (duration > 0 && typeof navigator.mediaSession.setPositionState === 'function') {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1,
          position: Math.min(Math.max(0, progress), duration),
        });
      } catch (err) {
        // Suppress position state errors on rapid updates
      }
    }
  }, [duration, progress]);

  // Action Handlers for Lockscreen & Bluetooth Hardware Controls
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    const actionHandlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => togglePlay()],
      ['pause', () => togglePlay()],
      ['previoustrack', () => playPrev()],
      ['nexttrack', () => playNext()],
      [
        'seekto',
        (details) => {
          if (details.seekTime !== undefined) {
            seekTo(details.seekTime);
          }
        },
      ],
    ];

    actionHandlers.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (error) {
        // Action may not be supported by browser
      }
    });

    return () => {
      actionHandlers.forEach(([action]) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch (e) {
          // Ignore
        }
      });
    };
  }, [togglePlay, playPrev, playNext, seekTo]);
}
