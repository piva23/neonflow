import { progressionEngine } from '../ProgressionEngine';
import { ProgressionStorage } from '../ProgressionStorage';

export interface TimelineEntry {
  id: string;
  type: 'achievement_unlocked' | 'level_up' | 'session_completed' | 'xp_bonus';
  timestamp: string;
  title: string;
  description: string;
  icon: string;
  badge?: string;
  xpValue?: number;
}

export class TimelineViewModel {
  /**
   * Generates a chronological timeline of progression milestones for a member
   */
  static getTimelineData(memberId: string): TimelineEntry[] {
    const timeline: TimelineEntry[] = [];

    // 1. Unlocked achievements
    const achievements = progressionEngine.getMemberAchievements(memberId);
    achievements
      .filter((a) => a.progresso.completed === true)
      .forEach((a) => {
        timeline.push({
          id: `ach-${a.id}`,
          type: 'achievement_unlocked',
          timestamp: a.progresso.unlockedAt
            ? new Date(a.progresso.unlockedAt).toISOString()
            : new Date().toISOString(),
          title: `Conquista Desbloqueada: ${a.nome}`,
          description: a.descrição,
          icon: a.ícone,
          badge: a.raridade,
          xpValue: a.xp,
        });
      });

    // 2. XP logs
    const logs = ProgressionStorage.getLogs(memberId) || [];
    logs.forEach((log) => {
      if (log.event.type === 'SESSION_FINISHED' || log.event.type === 'FAMILY_SESSION_COMPLETED') {
        timeline.push({
          id: `log-${log.event.id}`,
          type: 'session_completed',
          timestamp: new Date(log.event.timestamp).toISOString(),
          title: 'Sessão Concluída',
          description: `Ganhou +${log.xpGained} XP em sessão familiar`,
          icon: '🎧',
          xpValue: log.xpGained,
        });
      }
    });

    // Sort descending by timestamp
    return timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
