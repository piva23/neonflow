import { MemberProgress } from '../types';
import { ProgressionStorage } from '../ProgressionStorage';
import { LevelManager } from '../LevelManager';

export interface LeaderboardEntry {
  rank: number;
  memberId: string;
  level: number;
  levelTitle: string;
  totalXp: number;
  streakDays: number;
  badgesCount: number;
  isPodium: boolean;
  podiumBadge?: string; // 🥇, 🥈, 🥉
}

export class RankingViewModel {
  /**
   * Generates a ranked leaderboard of members sorted by Total XP
   */
  static getLeaderboard(memberIds: string[]): LeaderboardEntry[] {
    const memberProfiles: { id: string; progress: MemberProgress }[] = [];

    memberIds.forEach((id) => {
      let progress = ProgressionStorage.loadMemberProgress(id);
      if (!progress) {
        progress = {
          memberId: id,
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
      memberProfiles.push({ id, progress });
    });

    // Sort by total XP descending
    memberProfiles.sort((a, b) => b.progress.totalXp - a.progress.totalXp);

    return memberProfiles.map((item, index) => {
      const rank = index + 1;
      const levelInfo = LevelManager.calculateLevel(item.progress.totalXp);
      const isPodium = rank <= 3;
      let podiumBadge: string | undefined = undefined;

      if (rank === 1) podiumBadge = '🥇';
      else if (rank === 2) podiumBadge = '🥈';
      else if (rank === 3) podiumBadge = '🥉';

      return {
        rank,
        memberId: item.id,
        level: levelInfo.level,
        levelTitle: levelInfo.title,
        totalXp: item.progress.totalXp,
        streakDays: item.progress.streakDays || 1,
        badgesCount: (item.progress.unlockedRewards || []).filter((r) => r.type === 'badge').length,
        isPodium,
        podiumBadge,
      };
    });
  }
}
