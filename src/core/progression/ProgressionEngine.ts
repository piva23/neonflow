import {
  XPEventType,
  XPEvent,
  MemberProgress,
  FamilyProgress,
  SessionProgress,
  ProgressionUpdateResult,
  XPEventPayload,
  AchievementItem,
} from './types';
import { EventProcessor } from './EventProcessor';
import { ProgressionStorage } from './ProgressionStorage';
import { AchievementEngine } from './AchievementEngine';
import {
  getProgressionConfig,
  setProgressionConfig,
  resetProgressionConfig,
  ProgressionConfig,
} from './progressionConfig';

export class ProgressionEngine {
  private static instance: ProgressionEngine;
  private processor: EventProcessor;

  private constructor() {
    this.processor = new EventProcessor();
  }

  public static getInstance(): ProgressionEngine {
    if (!ProgressionEngine.instance) {
      ProgressionEngine.instance = new ProgressionEngine();
    }
    return ProgressionEngine.instance;
  }

  /**
   * Primary entry point to emit a progression event
   */
  public emitEvent(
    type: XPEventType,
    memberId: string,
    options?: {
      familyId?: string;
      sessionId?: string;
      payload?: XPEventPayload;
    }
  ): ProgressionUpdateResult {
    const event: XPEvent = {
      id: `xpevent_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type,
      memberId,
      familyId: options?.familyId,
      sessionId: options?.sessionId,
      timestamp: Date.now(),
      payload: options?.payload,
    };

    return this.processor.processEvent(event);
  }

  /**
   * Query Member Progress
   */
  public getMemberProgress(memberId: string): MemberProgress | null {
    return ProgressionStorage.loadMemberProgress(memberId);
  }

  /**
   * Query Member Achievements
   */
  public getMemberAchievements(memberId: string): AchievementItem[] {
    const memberProgress = this.getMemberProgress(memberId);
    if (!memberProgress) {
      const dummyProgress: MemberProgress = {
        memberId,
        level: 1,
        xp: 0,
        totalXp: 0,
        streakDays: 1,
        unlockedRewards: [],
        achievements: {},
        stats: {
          tracksPlayed: 0,
          tracksFinished: 0,
          tracksLiked: 0,
          tracksAdded: 0,
          playlistsCreated: 0,
          sessionsParticipated: 0,
          totalMinutesListened: 0,
          maxPlaylistSize: 0,
          discoveriesCount: 0,
          everyoneTogetherCount: 0,
        },
      };
      return AchievementEngine.getInstance().getAchievementsForMember(dummyProgress);
    }
    return AchievementEngine.getInstance().getAchievementsForMember(memberProgress);
  }

  /**
   * Query Family Progress
   */
  public getFamilyProgress(familyId: string): FamilyProgress | null {
    return ProgressionStorage.loadFamilyProgress(familyId);
  }

  /**
   * Query Session Progress
   */
  public getSessionProgress(sessionId: string): SessionProgress | null {
    return ProgressionStorage.loadSessionProgress(sessionId);
  }

  /**
   * Get XP Event Logs
   */
  public getLogs(memberId?: string) {
    return ProgressionStorage.getLogs(memberId);
  }

  /**
   * Configuration Management
   */
  public getConfig(): ProgressionConfig {
    return getProgressionConfig();
  }

  public setConfig(newConfig: Partial<ProgressionConfig>): ProgressionConfig {
    return setProgressionConfig(newConfig);
  }

  public resetConfig(): ProgressionConfig {
    return resetProgressionConfig();
  }

  /**
   * Subscribe to progression updates
   */
  public onProgressionUpdate(
    listener: (result: ProgressionUpdateResult) => void
  ): () => void {
    return this.processor.subscribe(listener);
  }

  /**
   * Clear all progression storage
   */
  public resetProgressionData(): void {
    ProgressionStorage.clear();
  }
}

export const progressionEngine = ProgressionEngine.getInstance();
