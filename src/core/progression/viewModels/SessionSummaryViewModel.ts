import { AchievementItem, Reward, ProgressionUpdateResult } from '../types';
import { Session } from '../../../types';
import { ProgressionStorage } from '../ProgressionStorage';

export interface SessionSummaryReport {
  sessionId: string;
  sessionName: string;
  durationMinutes: number;
  totalTracksPlayed: number;
  participantsCount: number;
  individualXp: number;
  familyXp: number;
  sessionXp: number;
  totalXpEarned: number;
  newLevel?: number;
  levelUp: boolean;
  unlockedAchievements: AchievementItem[];
  newBadges: Reward[];
  breakdownNotes: string[];
  topSong?: string;
  topArtist?: string;
  finishedAt: string;
}

export class SessionSummaryViewModel {
  /**
   * Generates a comprehensive summary report after a session completes
   */
  static generateReport(
    session: Session,
    memberId: string,
    lastProgressionResult?: ProgressionUpdateResult | null
  ): SessionSummaryReport {
    const memberProgress = ProgressionStorage.loadMemberProgress(memberId);
    const sessionProgress = ProgressionStorage.loadSessionProgress(session.id);

    const durationMinutes = Math.ceil((session.duration || 0) / 60);
    const totalTracksPlayed = session.songs?.length || 0;
    const participantsCount = session.participants?.length || 1;

    let individualXp = lastProgressionResult?.xpCalculation?.individualXp || 0;
    let familyXp = lastProgressionResult?.xpCalculation?.familyXp || 0;
    let sessionXp = sessionProgress?.totalXpEarned || lastProgressionResult?.xpCalculation?.sessionXp || 0;
    let totalXpEarned = lastProgressionResult?.xpGained || (individualXp + familyXp + sessionXp);

    const breakdownNotes = lastProgressionResult?.xpCalculation?.breakdownNotes || [
      `Sessão ${session.name} concluída`,
      `Duração: ${durationMinutes} min`,
      `Músicas ouvidas: ${totalTracksPlayed}`,
    ];

    const unlockedAchievements = lastProgressionResult?.newAchievementsUnlocked || [];
    const newBadges = lastProgressionResult?.newRewards || [];

    const stats = session.statistics;

    return {
      sessionId: session.id,
      sessionName: session.name,
      durationMinutes,
      totalTracksPlayed,
      participantsCount,
      individualXp,
      familyXp,
      sessionXp,
      totalXpEarned,
      newLevel: memberProgress?.level,
      levelUp: lastProgressionResult?.levelUp || false,
      unlockedAchievements,
      newBadges,
      breakdownNotes,
      topSong: stats?.topSong,
      topArtist: stats?.topArtist,
      finishedAt: session.finishedAt || new Date().toISOString(),
    };
  }
}
