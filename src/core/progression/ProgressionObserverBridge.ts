import { playerEvents } from '../player/PlayerEvents';
import { Track, Session } from '../../types';
import { progressionEngine } from './ProgressionEngine';
import { SessionSummaryViewModel, SessionSummaryReport } from './viewModels/SessionSummaryViewModel';
import { musicalMemoriesEngine } from '../memories/MusicalMemoriesEngine';

export class ProgressionObserverBridge {
  private static instance: ProgressionObserverBridge;
  private isInitialized: boolean = false;
  private currentActiveTrackId: string | null = null;
  private trackStartTime: number = 0;

  private constructor() {}

  public static getInstance(): ProgressionObserverBridge {
    if (!ProgressionObserverBridge.instance) {
      ProgressionObserverBridge.instance = new ProgressionObserverBridge();
    }
    return ProgressionObserverBridge.instance;
  }

  /**
   * Initializes automatic event listeners for Player & Sessions
   */
  public init(defaultMemberId: string = 'm-1', defaultFamilyId: string = 'fam-1'): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Initialize Musical Memories Engine
    musicalMemoriesEngine.init();

    // 1. Listen to automatic Player track change
    playerEvents.on('trackChange', (track: Track | null) => {
      if (track && track.id !== this.currentActiveTrackId) {
        this.currentActiveTrackId = track.id;
        this.trackStartTime = Date.now();

        progressionEngine.emitEvent('TRACK_STARTED', defaultMemberId, {
          familyId: defaultFamilyId,
          payload: {
            trackId: track.id,
            trackTitle: track.title,
            artist: track.artist,
          },
        });

        // Automatically record Musical Memories history and timeline
        musicalMemoriesEngine.recordTrackPlay({
          trackId: track.id,
          trackTitle: track.title,
          artist: track.artist,
          album: track.album,
          thumbnail: track.thumbnail,
          durationSeconds: track.duration,
          memberId: defaultMemberId,
          familyId: defaultFamilyId,
          contextTags: [...(track.occasion || []), ...(track.tags || [])],
        });
      }
    });

    // 2. Listen to automatic Player track ended
    playerEvents.on('trackEnded', () => {
      if (this.currentActiveTrackId) {
        const listenedSec = Math.floor((Date.now() - this.trackStartTime) / 1000);
        const durationMin = Math.max(1, Math.ceil(listenedSec / 60));

        progressionEngine.emitEvent('TRACK_FINISHED', defaultMemberId, {
          familyId: defaultFamilyId,
          payload: {
            trackId: this.currentActiveTrackId,
            durationMinutes: durationMin,
            isCompleted: true,
          },
        });

        this.currentActiveTrackId = null;
      }
    });
  }

  /**
   * Handle session start event automatically
   */
  public onSessionStart(session: Session, memberId: string, familyId?: string): void {
    progressionEngine.emitEvent('MEMBER_JOINED_SESSION', memberId, {
      familyId,
      sessionId: session.id,
      payload: {
        sessionType: session.type,
      },
    });

    // Check if it's the first session of the day
    const today = new Date().toISOString().slice(0, 10);
    const lastSessionKey = `last_session_date_${memberId}`;
    const lastDate = localStorage.getItem(lastSessionKey);

    if (lastDate !== today) {
      localStorage.setItem(lastSessionKey, today);
      progressionEngine.emitEvent('FIRST_SESSION_OF_DAY', memberId, {
        familyId,
        sessionId: session.id,
      });
    }
  }

  /**
   * Handle session completion event automatically
   */
  public onSessionFinish(
    session: Session,
    memberId: string,
    familyId?: string
  ): SessionSummaryReport {
    const durationMinutes = Math.ceil((session.duration || 0) / 60);

    // 1. Emit Individual Session Finish
    const result1 = progressionEngine.emitEvent('SESSION_FINISHED', memberId, {
      familyId,
      sessionId: session.id,
      payload: {
        durationMinutes,
        tracksPlayedCount: session.songs?.length || 0,
      },
    });

    // 2. Emit Family Session Completed
    const result2 = progressionEngine.emitEvent('FAMILY_SESSION_COMPLETED', memberId, {
      familyId,
      sessionId: session.id,
      payload: {
        durationMinutes,
        participantCount: session.participants?.length || 1,
      },
    });

    // 3. Emit Everyone Listening Together if multiple participants
    if (session.participants && session.participants.length > 1) {
      progressionEngine.emitEvent('EVERYONE_LISTENING_TOGETHER', memberId, {
        familyId,
        sessionId: session.id,
      });
    }

    // 4. Generate & return complete session summary report
    return SessionSummaryViewModel.generateReport(session, memberId, result2 || result1);
  }

  /**
   * Handle track favorited / liked event automatically
   */
  public onTrackLiked(trackId: string, memberId: string, familyId?: string): void {
    progressionEngine.emitEvent('TRACK_LIKED', memberId, {
      familyId,
      payload: { trackId },
    });
  }

  /**
   * Handle track added to library automatically
   */
  public onTrackAdded(trackId: string, memberId: string, familyId?: string): void {
    progressionEngine.emitEvent('TRACK_ADDED', memberId, {
      familyId,
      payload: { trackId },
    });
  }

  /**
   * Handle track discovered in first hand
   */
  public onTrackDiscovered(trackId: string, memberId: string, familyId?: string): void {
    progressionEngine.emitEvent('TRACK_DISCOVERED', memberId, {
      familyId,
      payload: { trackId, isDiscovery: true },
    });
    if (familyId) {
      progressionEngine.emitEvent('DISCOVERY_TRACK_ADDED', memberId, {
        familyId,
        payload: { trackId, isDiscovery: true },
      });
    }
  }

  /**
   * Handle first play of a track for the entire family
   */
  public onFamilyFirstPlay(trackId: string, memberId: string, familyId?: string): void {
    progressionEngine.emitEvent('FAMILY_FIRST_PLAY', memberId, {
      familyId,
      payload: { trackId, isFamilyFirstPlay: true },
    });
  }

  /**
   * Handle unanimous likes in session (100% of participants liked)
   */
  public onUnanimousLikes(trackId: string, memberId: string, familyId?: string): void {
    progressionEngine.emitEvent('UNANIMOUS_LIKES', memberId, {
      familyId,
      payload: { trackId, isUnanimousLikes: true },
    });
  }

  /**
   * Handle session completed with zero skips
   */
  public onPerfectSessionNoSkips(sessionId: string, memberId: string, familyId?: string): void {
    progressionEngine.emitEvent('PERFECT_SESSION_NO_SKIPS', memberId, {
      familyId,
      sessionId,
      payload: { hasNoSkips: true },
    });
  }

  /**
   * Handle playlist creation automatically
   */
  public onPlaylistCreated(
    playlistId: string,
    isFamilyShared: boolean,
    memberId: string,
    familyId?: string,
    trackCount: number = 0
  ): void {
    progressionEngine.emitEvent('PLAYLIST_CREATED', memberId, {
      familyId,
      payload: {
        playlistId,
        playlistTrackCount: trackCount,
      },
    });

    if (isFamilyShared) {
      progressionEngine.emitEvent('SHARED_PLAYLIST_CREATED', memberId, {
        familyId,
        payload: {
          playlistId,
          playlistTrackCount: trackCount,
        },
      });
    }
  }
}

export const progressionObserverBridge = ProgressionObserverBridge.getInstance();
