import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Session,
  SessionType,
  SessionStatus,
  SessionSong,
  SessionTimelineEvent,
  SessionStatistics,
  SessionParticipant,
  Track,
  Family,
  Member,
} from '../types';
import { storage } from '../services/storage';

import { useFamily } from './FamilyContext';
import { useApp } from './AppContext';
import toast from 'react-hot-toast';
import { playerEvents, playerEngine } from '../core/player';
import { progressionObserverBridge } from '../core/progression/ProgressionObserverBridge';

interface CreatePlannedSessionInput {
  name: string;
  description?: string;
  playlistId?: string;
  playlistName?: string;
  participants: string[];
  participantDetails?: SessionParticipant[];
  controllerId?: string;
  controllerName?: string;
  scheduledAt?: string;
  notes?: string;
  mood?: string;
  objective?: string;
  cover?: string;
  color?: string;
}

interface SessionContextType {
  // Family compatibility
  family: Family;
  updateFamilyName: (name: string) => void;
  regenerateInviteCode: () => void;
  resetAllData: () => void;

  // Musical Sessions
  sessions: Session[];
  activeSession: Session | null;
  startPlanejadaSession: (input: CreatePlannedSessionInput) => Session;
  startLivreSession: (firstTrack?: Track, activeMemberId?: string) => Session;
  recordSongPlayInSession: (track: Track, memberId?: string) => void;
  updateSongProgressInSession: (trackId: string, listenedSeconds: number, isSkipped?: boolean, isFavorited?: boolean) => void;
  addParticipantToActiveSession: (memberId: string, memberName?: string, avatar?: string) => void;
  removeParticipantFromActiveSession: (memberId: string, memberName?: string) => void;
  addMomentToSession: (sessionId: string, momentText: string) => void;
  finishActiveSession: () => Session | null;
  cancelActiveSession: () => void;
  deleteSession: (sessionId: string) => void;
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { family, updateFamily, regenerateInviteCode: regenInvite } = useFamily();
  const { addNotification } = useApp();

  // Sessions list
  const [sessions, setSessions] = useState<Session[]>(() => {
    return storage.load<Session[]>('musical_sessions', []);
  });

  // Active Session
  const [activeSession, setActiveSession] = useState<Session | null>(() => {
    return storage.load<Session | null>('musical_active_session', null);
  });

  // Keep a ref to activeSession to avoid stale closures inside timers and event listeners
  const activeSessionRef = useRef<Session | null>(activeSession);
  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  // Persist Sessions
  useEffect(() => {
    storage.save('musical_sessions', sessions);
  }, [sessions]);

  // Persist Active Session
  useEffect(() => {
    storage.save('musical_active_session', activeSession);
  }, [activeSession]);

  // Active session timer to track duration in real-time
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeSession && activeSession.status === 'active') {
      interval = setInterval(() => {
        setActiveSession((prev) => {
          if (!prev || prev.status !== 'active') return prev;
          const startMs = new Date(prev.startedAt).getTime();
          const nowMs = Date.now();
          const elapsedSec = Math.floor((nowMs - startMs) / 1000);
          return {
            ...prev,
            duration: elapsedSec,
          };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession?.id, activeSession?.status]);

  // ---------------- Family Helper Methods ----------------
  const updateFamilyName = (name: string) => {
    if (!name || name.trim() === '') return;
    updateFamily(family.id, {
      name: name.trim(),
      familyName: name.trim(),
    });
  };

  const regenerateInviteCode = () => {
    regenInvite();
  };

  const resetAllData = () => {
    storage.clear();
    window.location.reload();
  };

  // ---------------- Musical Session Helper Methods ----------------

  // Calculate statistics for a session
  const calculateSessionStats = (songs: SessionSong[], participantsCount: number, playlistName?: string): SessionStatistics => {
    const totalSongs = songs.length;
    const listenTime = songs.reduce((acc, s) => acc + (s.listenedTime || 0), 0);

    // Find top artist & top song
    const artistCounts: Record<string, number> = {};
    const songCounts: Record<string, number> = {};

    songs.forEach((s) => {
      artistCounts[s.artist] = (artistCounts[s.artist] || 0) + 1;
      songCounts[s.title] = (songCounts[s.title] || 0) + 1;
    });

    let topArtist = '';
    let maxArtistCount = 0;
    Object.entries(artistCounts).forEach(([artist, count]) => {
      if (count > maxArtistCount) {
        maxArtistCount = count;
        topArtist = artist;
      }
    });

    let topSong = '';
    let maxSongCount = 0;
    Object.entries(songCounts).forEach(([title, count]) => {
      if (count > maxSongCount) {
        maxSongCount = count;
        topSong = title;
      }
    });

    return {
      totalSongs,
      listenTime,
      topSong: topSong || (songs[0]?.title ?? 'Nenhuma'),
      topArtist: topArtist || (songs[0]?.artist ?? 'Nenhum'),
      playlistName: playlistName || undefined,
      participantsCount,
    };
  };

  // 1. Start Planned Session
  const startPlanejadaSession = (input: CreatePlannedSessionInput): Session => {
    const now = new Date().toISOString();
    const newSessionId = `sess-${Date.now()}`;

    const startEvent: SessionTimelineEvent = {
      id: `evt-${Date.now()}-1`,
      type: 'start',
      timestamp: now,
      title: 'Sessão Planejada Iniciada',
      description: `Sessão "${input.name}" iniciada com ${input.participants.length} participante(s).`,
    };

    const newSession: Session = {
      id: newSessionId,
      name: input.name,
      description: input.description || '',
      type: 'planejada',
      status: 'active',
      createdAt: now,
      startedAt: now,
      scheduledAt: input.scheduledAt || now,
      duration: 0,
      playlistId: input.playlistId,
      playlistName: input.playlistName,
      controllerId: input.controllerId,
      controllerName: input.controllerName,
      notes: input.notes,
      participants: input.participants,
      participantDetails: input.participantDetails,
      songs: [],
      timeline: [startEvent],
      favoriteMoments: [],
      mood: input.mood || 'Animado',
      objective: input.objective || '',
      cover: input.cover || '🎶',
      color: input.color || '#8338ec',
      statistics: {
        totalSongs: 0,
        listenTime: 0,
        playlistName: input.playlistName,
        participantsCount: input.participants.length,
      },
    };

    // If there was an active session running, complete it first
    if (activeSession) {
      finishActiveSession();
    }

    setActiveSession(newSession);
    progressionObserverBridge.onSessionStart(newSession, input.controllerId || 'm-1', family.id);
    return newSession;
  };

  // 2. Start Free Session
  const startLivreSession = (firstTrack?: Track, activeMemberId?: string): Session => {
    const now = new Date().toISOString();
    const newSessionId = `sess-${Date.now()}`;

    // Get family members or fallback to single active member
    const defaultParticipants = activeMemberId
      ? [activeMemberId]
      : family.members?.map((m) => m.id) || [];

    const sessionName = firstTrack
      ? `Sessão Livre (${firstTrack.artist})`
      : `Sessão Livre #${sessions.length + 1}`;

    const startEvent: SessionTimelineEvent = {
      id: `evt-${Date.now()}-start`,
      type: 'start',
      timestamp: now,
      title: 'Sessão Livre Iniciada',
      description: 'Criada automaticamente ao iniciar reprodução.',
    };

    const initialSongs: SessionSong[] = firstTrack
      ? [
          {
            id: `ss-${Date.now()}`,
            trackId: firstTrack.id,
            title: firstTrack.title,
            artist: firstTrack.artist,
            thumbnail: firstTrack.thumbnail,
            startedAt: now,
            listenedTime: 0,
            skipped: false,
            favorited: Boolean(firstTrack.favorite),
          },
        ]
      : [];

    const timelineEvents: SessionTimelineEvent[] = [startEvent];
    if (firstTrack) {
      timelineEvents.push({
        id: `evt-${Date.now()}-song`,
        type: 'song_start',
        timestamp: now,
        title: 'Música Iniciada',
        description: `${firstTrack.title} - ${firstTrack.artist}`,
        metadata: {
          songTitle: firstTrack.title,
          artist: firstTrack.artist,
        },
      });
    }

    const newSession: Session = {
      id: newSessionId,
      name: sessionName,
      description: 'Sessão musical espontânea criada automaticamente ao tocar.',
      type: 'livre',
      status: 'active',
      createdAt: now,
      startedAt: now,
      duration: 0,
      participants: defaultParticipants.length > 0 ? defaultParticipants : ['m-default'],
      songs: initialSongs,
      timeline: timelineEvents,
      favoriteMoments: [],
      mood: firstTrack?.emotion || 'Relaxante',
      cover: '🎧',
      color: '#3a86ff',
      statistics: calculateSessionStats(
        initialSongs,
        defaultParticipants.length || 1
      ),
    };

    setActiveSession(newSession);
    progressionObserverBridge.onSessionStart(newSession, activeMemberId || 'm-1', family.id);
    return newSession;
  };

  // 3. Record song play in active session
  const recordSongPlayInSession = (track: Track, memberId?: string) => {
    setActiveSession((prev) => {
      let current = prev;

      // If no active session, start a free session with this track
      if (!current || current.status !== 'active') {
        return startLivreSession(track, memberId);
      }

      const now = new Date().toISOString();

      // Check if this track is already the latest song in active session
      const latestSong = current.songs[current.songs.length - 1];
      if (latestSong && latestSong.trackId === track.id && !latestSong.endedAt) {
        return current;
      }

      // Close previous song if present
      const updatedSongs = current.songs.map((s, idx) => {
        if (idx === current.songs.length - 1 && !s.endedAt) {
          return {
            ...s,
            endedAt: now,
          };
        }
        return s;
      });

      // Add new song
      const newSong: SessionSong = {
        id: `ss-${Date.now()}`,
        trackId: track.id,
        title: track.title,
        artist: track.artist,
        thumbnail: track.thumbnail,
        startedAt: now,
        listenedTime: 0,
        skipped: false,
        favorited: Boolean(track.favorite),
      };

      updatedSongs.push(newSong);

      // Add timeline event
      const newTimelineEvent: SessionTimelineEvent = {
        id: `evt-${Date.now()}`,
        type: 'song_start',
        timestamp: now,
        title: 'Música Tocada',
        description: `${track.title} por ${track.artist}`,
        metadata: {
          songTitle: track.title,
          artist: track.artist,
        },
      };

      const updatedTimeline = [...current.timeline, newTimelineEvent];
      const stats = calculateSessionStats(
        updatedSongs,
        current.participants.length,
        current.playlistName
      );

      return {
        ...current,
        songs: updatedSongs,
        timeline: updatedTimeline,
        statistics: stats,
      };
    });
  };

  // 4. Update song progress in session
  const updateSongProgressInSession = (
    trackId: string,
    listenedSeconds: number,
    isSkipped?: boolean,
    isFavorited?: boolean
  ) => {
    setActiveSession((prev) => {
      if (!prev || prev.songs.length === 0) return prev;

      const targetSong = prev.songs.find((s) => s.trackId === trackId);
      if (targetSong) {
        const newTime = Math.max(targetSong.listenedTime, listenedSeconds);
        const newSkipped = isSkipped !== undefined ? isSkipped : targetSong.skipped;
        const newFavorited = isFavorited !== undefined ? isFavorited : targetSong.favorited;

        if (
          targetSong.listenedTime === newTime &&
          targetSong.skipped === newSkipped &&
          targetSong.favorited === newFavorited
        ) {
          return prev;
        }
      }

      const updatedSongs = prev.songs.map((song) => {
        if (song.trackId === trackId) {
          return {
            ...song,
            listenedTime: Math.max(song.listenedTime, listenedSeconds),
            skipped: isSkipped !== undefined ? isSkipped : song.skipped,
            favorited: isFavorited !== undefined ? isFavorited : song.favorited,
          };
        }
        return song;
      });

      const stats = calculateSessionStats(
        updatedSongs,
        prev.participants.length,
        prev.playlistName
      );

      return {
        ...prev,
        songs: updatedSongs,
        statistics: stats,
      };
    });
  };

  // 5. Add Participant
  const addParticipantToActiveSession = (memberId: string, memberName?: string, avatar?: string) => {
    setActiveSession((prev) => {
      if (!prev) return null;
      if (prev.participants.includes(memberId)) return prev;

      const now = new Date().toISOString();
      const updatedParticipants = [...prev.participants, memberId];

      const event: SessionTimelineEvent = {
        id: `evt-${Date.now()}`,
        type: 'participant_add',
        timestamp: now,
        title: 'Membro Entrou na Sessão',
        description: `${memberName || 'Um membro'} juntou-se à experiência.`,
        metadata: {
          memberName,
          memberAvatar: avatar,
        },
      };

      const stats = calculateSessionStats(
        prev.songs,
        updatedParticipants.length,
        prev.playlistName
      );

      return {
        ...prev,
        participants: updatedParticipants,
        timeline: [...prev.timeline, event],
        statistics: stats,
      };
    });
  };

  // 6. Remove Participant
  const removeParticipantFromActiveSession = (memberId: string, memberName?: string) => {
    setActiveSession((prev) => {
      if (!prev) return null;
      if (!prev.participants.includes(memberId)) return prev;

      const now = new Date().toISOString();
      const updatedParticipants = prev.participants.filter((id) => id !== memberId);

      const event: SessionTimelineEvent = {
        id: `evt-${Date.now()}`,
        type: 'participant_remove',
        timestamp: now,
        title: 'Membro Saiu da Sessão',
        description: `${memberName || 'Um membro'} saiu da sessão.`,
        metadata: {
          memberName,
        },
      };

      const stats = calculateSessionStats(
        prev.songs,
        updatedParticipants.length,
        prev.playlistName
      );

      return {
        ...prev,
        participants: updatedParticipants,
        timeline: [...prev.timeline, event],
        statistics: stats,
      };
    });
  };

  // 7. Add Favorite Moment to session
  const addMomentToSession = (sessionId: string, momentText: string) => {
    if (!momentText.trim()) return;

    // If it's the active session
    if (activeSession && activeSession.id === sessionId) {
      setActiveSession((prev) => {
        if (!prev) return null;
        const now = new Date().toISOString();
        const updatedMoments = [...(prev.favoriteMoments || []), momentText.trim()];

        const event: SessionTimelineEvent = {
          id: `evt-${Date.now()}`,
          type: 'moment_add',
          timestamp: now,
          title: 'Momento Especial Registrado',
          description: momentText.trim(),
          metadata: {
            momentText: momentText.trim(),
          },
        };

        return {
          ...prev,
          favoriteMoments: updatedMoments,
          timeline: [...prev.timeline, event],
        };
      });
      return;
    }

    // Else update in history sessions
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          const now = new Date().toISOString();
          const updatedMoments = [...(s.favoriteMoments || []), momentText.trim()];
          const event: SessionTimelineEvent = {
            id: `evt-${Date.now()}`,
            type: 'moment_add',
            timestamp: now,
            title: 'Momento Especial Registrado',
            description: momentText.trim(),
            metadata: {
              momentText: momentText.trim(),
            },
          };
          return {
            ...s,
            favoriteMoments: updatedMoments,
            timeline: [...s.timeline, event],
          };
        }
        return s;
      })
    );
  };

  // 8. Finish Active Session
  const finishActiveSession = useCallback((): Session | null => {
    const currentActive = activeSessionRef.current;
    if (!currentActive) return null;

    const now = new Date().toISOString();
    const startMs = new Date(currentActive.startedAt).getTime();
    const finishMs = new Date(now).getTime();
    const finalDuration = Math.max(
      currentActive.duration,
      Math.floor((finishMs - startMs) / 1000)
    );

    const finishEvent: SessionTimelineEvent = {
      id: `evt-${Date.now()}-finish`,
      type: 'finish',
      timestamp: now,
      title: 'Sessão Finalizada',
      description: `Sessão concluída com ${currentActive.songs.length} músicas e ${Math.ceil(
        finalDuration / 60
      )} min de duração.`,
    };

    const finalStats = calculateSessionStats(
      currentActive.songs,
      currentActive.participants.length,
      currentActive.playlistName
    );

    const completedSession: Session = {
      ...currentActive,
      status: 'completed',
      finishedAt: now,
      duration: finalDuration,
      timeline: [...currentActive.timeline, finishEvent],
      statistics: finalStats,
    };

    // Save to sessions history
    setSessions((prev) => [completedSession, ...prev.filter((s) => s.id !== completedSession.id)]);
    setActiveSession(null);

    // Trigger automatic session progression & XP calculation (emits SESSION_FINISHED event)
    progressionObserverBridge.onSessionFinish(completedSession, 'm-1', family.id);

    return completedSession;
  }, [family.id]);

  // ---------------- Inactivity Session Termination (3 Minutes = 180,000 ms) ----------------
  const INACTIVITY_TIMEOUT_MS = 180000;
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const clearInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };

    const handlePlaybackState = (isPlaying: boolean) => {
      const currentActive = activeSessionRef.current;
      if (!currentActive || currentActive.status !== 'active') {
        clearInactivityTimer();
        return;
      }

      if (isPlaying) {
        // Audio resumed -> cancel automatic termination timer
        clearInactivityTimer();
      } else {
        // Audio paused, stopped, or queue finished -> start 3-minute timer if not already running
        if (!inactivityTimerRef.current) {
          inactivityTimerRef.current = setTimeout(() => {
            const sessionToFinish = activeSessionRef.current;
            if (sessionToFinish && sessionToFinish.status === 'active') {
              finishActiveSession();

              // Trigger global UI Feedback Toast & App Notification
              toast.success('Sessão finalizada por inatividade. XP salvo!', {
                icon: '⏳',
                duration: 5000,
              });
              addNotification(
                'Sessão Finalizada',
                'Sessão finalizada por inatividade. XP salvo!',
                'gamification'
              );
            }
            inactivityTimerRef.current = null;
          }, INACTIVITY_TIMEOUT_MS);
        }
      }
    };

    // Initial state check when active session changes or component mounts
    if (activeSession && activeSession.status === 'active') {
      const isCurrentlyPlaying = playerEngine.getIsPlaying();
      handlePlaybackState(isCurrentlyPlaying);
    } else {
      clearInactivityTimer();
    }

    // Event listeners for player state changes
    const unsubPlayback = playerEvents.on('playbackStateChange', (playing: boolean) => {
      handlePlaybackState(playing);
    });

    const unsubTrackEnded = playerEvents.on('trackEnded', () => {
      const isCurrentlyPlaying = playerEngine.getIsPlaying();
      handlePlaybackState(isCurrentlyPlaying);
    });

    return () => {
      unsubPlayback();
      unsubTrackEnded();
      clearInactivityTimer();
    };
  }, [activeSession?.id, activeSession?.status, finishActiveSession, addNotification]);

  // 9. Cancel Active Session
  const cancelActiveSession = () => {
    setActiveSession(null);
  };

  // 10. Delete Session
  const deleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSession && activeSession.id === sessionId) {
      setActiveSession(null);
    }
  };

  // 11. Update Session
  const updateSession = (sessionId: string, updates: Partial<Session>) => {
    if (activeSession && activeSession.id === sessionId) {
      setActiveSession((prev) => (prev ? { ...prev, ...updates } : null));
    }
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, ...updates } : s))
    );
  };

  return (
    <SessionContext.Provider
      value={{
        family,
        updateFamilyName,
        regenerateInviteCode,
        resetAllData,
        sessions,
        activeSession,
        startPlanejadaSession,
        startLivreSession,
        recordSongPlayInSession,
        updateSongProgressInSession,
        addParticipantToActiveSession,
        removeParticipantFromActiveSession,
        addMomentToSession,
        finishActiveSession,
        cancelActiveSession,
        deleteSession,
        updateSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
