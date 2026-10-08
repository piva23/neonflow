import { MemberProgress, Reward } from '../types';
import { ProgressionStorage } from '../ProgressionStorage';
import { LevelManager } from '../LevelManager';

export interface ProfileViewData {
  memberId: string;
  level: number;
  levelTitle: string;
  currentXp: number;
  nextLevelXp: number;
  xpPercentage: number;
  totalXp: number;
  streakDays: number;
  tracksPlayed: number;
  tracksFinished: number;
  tracksLiked: number;
  playlistsCreated: number;
  sessionsParticipated: number;
  totalMinutesListened: number;
  unlockedRewards: Reward[];
  unlockedBadgesCount: number;
}

export class ProfileViewModel {
  /**
   * Generates profile view data for a given member
   */
  static getProfileData(memberId: string): ProfileViewData {
    let progress = ProgressionStorage.loadMemberProgress(memberId);
    if (!progress) {
      progress = {
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
    }

    const levelInfo = LevelManager.calculateLevel(progress.totalXp);
    const stats = progress.stats || {
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
    };

    return {
      memberId,
      level: levelInfo.level,
      levelTitle: levelInfo.title,
      currentXp: levelInfo.currentLevelXp,
      nextLevelXp: levelInfo.nextLevelXp,
      xpPercentage: levelInfo.progressPercent,
      totalXp: progress.totalXp,
      streakDays: progress.streakDays || 1,
      tracksPlayed: stats.tracksPlayed || 0,
      tracksFinished: stats.tracksFinished || 0,
      tracksLiked: stats.tracksLiked || 0,
      playlistsCreated: stats.playlistsCreated || 0,
      sessionsParticipated: stats.sessionsParticipated || 0,
      totalMinutesListened: stats.totalMinutesListened || 0,
      unlockedRewards: progress.unlockedRewards || [],
      unlockedBadgesCount: (progress.unlockedRewards || []).filter((r) => r.type === 'badge').length,
    };
  }
}
