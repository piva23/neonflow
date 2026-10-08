import { AchievementItem, AchievementCategory, AchievementRarity } from '../types';
import { progressionEngine } from '../ProgressionEngine';

export interface AchievementFilterOptions {
  category?: AchievementCategory | 'all';
  rarity?: AchievementRarity | 'all';
  status?: 'all' | 'completed' | 'in_progress' | 'locked';
}

export class AchievementsViewModel {
  /**
   * Retrieves and formats all available achievements for a member with filtering capabilities.
   * Masks secret achievements when they are still locked.
   */
  static getMemberAchievementsView(
    memberId: string,
    filters?: AchievementFilterOptions
  ): AchievementItem[] {
    const achievements = progressionEngine.getMemberAchievements(memberId);

    return achievements
      .map((item) => {
        if (item.isSecret && !item.progresso.completed) {
          return {
            ...item,
            nome: '??? (Conquista Oculta)',
            descrição: 'Cumpra um feito secreto em família para revelar e desbloquear.',
            ícone: '🔒',
          };
        }
        return item;
      })
      .filter((item) => {
        if (filters?.category && filters.category !== 'all' && item.categoria !== filters.category) {
          return false;
        }
        if (filters?.rarity && filters.rarity !== 'all' && item.raridade !== filters.rarity) {
          return false;
        }
        if (filters?.status) {
          if (filters.status === 'completed' && item.progresso.completed !== true) return false;
          if (filters.status === 'in_progress' && (item.progresso.percent === 0 || item.progresso.completed === true)) return false;
          if (filters.status === 'locked' && item.progresso.percent > 0) return false;
        }
        return true;
      });
  }

  /**
   * Summary breakdown of achievements completion by category and rarity
   */
  static getAchievementsSummary(memberId: string) {
    const achievements = progressionEngine.getMemberAchievements(memberId);
    const total = achievements.length;
    const completed = achievements.filter((a) => a.progresso.completed === true).length;
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const rarityBreakdown: Record<AchievementRarity, { completed: number; total: number }> = {
      Bronze: { completed: 0, total: 0 },
      Prata: { completed: 0, total: 0 },
      Ouro: { completed: 0, total: 0 },
      Platina: { completed: 0, total: 0 },
      Lendário: { completed: 0, total: 0 },
    };

    achievements.forEach((a) => {
      if (rarityBreakdown[a.raridade]) {
        rarityBreakdown[a.raridade].total++;
        if (a.progresso.completed === true) {
          rarityBreakdown[a.raridade].completed++;
        }
      }
    });

    return {
      total,
      completed,
      completionPercentage,
      rarityBreakdown,
    };
  }
}
