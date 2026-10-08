import { Reward } from './types';

export interface LevelInfo {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  title: string;
}

export class LevelManager {
  /**
   * Calculate cumulative XP needed to reach a given level.
   * Smooth exponential curve designed for multi-year progression.
   * L2 = 100 XP, L3 = 300 XP, L5 = 1200 XP, L10 = 6000 XP, L25 = 50000 XP, L50 = 400000 XP.
   */
  static getXpForLevel(level: number): number {
    if (level <= 1) return 0;
    return Math.floor(100 * (level - 1) + 80 * Math.pow(level - 1, 2.15));
  }

  /**
   * Derive level information from total accumulated XP
   */
  static calculateLevel(totalXp: number): LevelInfo {
    let level = 1;
    while (totalXp >= this.getXpForLevel(level + 1)) {
      level++;
    }

    const currentLevelBase = this.getXpForLevel(level);
    const nextLevelBase = this.getXpForLevel(level + 1);
    const xpInCurrentLevel = totalXp - currentLevelBase;
    const xpNeededForNext = nextLevelBase - currentLevelBase;

    const progressPercent = Math.min(
      100,
      Math.max(0, Math.floor((xpInCurrentLevel / xpNeededForNext) * 100))
    );

    return {
      level,
      currentLevelXp: xpInCurrentLevel,
      nextLevelXp: xpNeededForNext,
      progressPercent,
      title: this.getTitleForLevel(level),
    };
  }

  /**
   * Get title badge description for a given level according to NeonFlow hierarchy:
   * Sintonizador, Explorador Musical, Descobridor, Colecionador, DJ da Família,
   * Criador de Hits, Maestro Familiar, Lenda Musical.
   */
  static getTitleForLevel(level: number): string {
    if (level >= 100) return 'Lenda Eterna do NeonFlow';
    if (level >= 75) return 'Lenda Musical';
    if (level >= 50) return 'Maestro Familiar';
    if (level >= 35) return 'Criador de Hits';
    if (level >= 25) return 'DJ da Família';
    if (level >= 18) return 'Colecionador';
    if (level >= 12) return 'Descobridor';
    if (level >= 6) return 'Explorador Musical';
    if (level >= 3) return 'Sintonizador';
    return 'Iniciante Musical';
  }

  /**
   * Get unlocked reward for reaching a level
   */
  static getRewardsForLevel(level: number): Reward[] {
    const rewards: Reward[] = [];

    if (level === 3) {
      rewards.push({
        id: `reward_lvl_${level}`,
        title: 'Título: Sintonizador',
        description: 'Sua sintonia com a música familiar está crescendo!',
        badgeIcon: '📻',
        type: 'title',
        unlockedAt: Date.now(),
      });
    }

    if (level === 6) {
      rewards.push({
        id: `reward_lvl_${level}`,
        title: 'Título: Explorador Musical',
        description: 'Mapeando novas sonoridades para a família NeonFlow!',
        badgeIcon: '🧭',
        type: 'title',
        unlockedAt: Date.now(),
      });
    }

    if (level === 12) {
      rewards.push({
        id: `reward_lvl_${level}`,
        title: 'Título: Descobridor',
        description: 'Apresentou faixas incríveis e raras na biblioteca!',
        badgeIcon: '🔍',
        type: 'title',
        unlockedAt: Date.now(),
      });
    }

    if (level === 18) {
      rewards.push({
        id: `reward_lvl_${level}`,
        title: 'Título: Colecionador',
        description: 'Sua acervo musical familiar é vasto e admirável!',
        badgeIcon: '📚',
        type: 'title',
        unlockedAt: Date.now(),
      });
    }

    if (level === 25) {
      rewards.push({
        id: `reward_lvl_${level}`,
        title: 'Título: DJ da Família',
        description: 'Comanda o ritmo e anima todas as sessões familiares!',
        badgeIcon: '🎧',
        type: 'title',
        unlockedAt: Date.now(),
      });
    }

    if (level === 35) {
      rewards.push({
        id: `reward_lvl_${level}`,
        title: 'Título: Criador de Hits',
        description: 'Músicas cadastradas por você viraram os maiores sucessos da casa!',
        badgeIcon: '🔥',
        type: 'title',
        unlockedAt: Date.now(),
      });
    }

    if (level === 50) {
      rewards.push({
        id: `reward_lvl_${level}`,
        title: 'Título: Maestro Familiar',
        description: 'Regente supremo da harmonia sonora da família!',
        badgeIcon: '👑',
        type: 'title',
        unlockedAt: Date.now(),
      });
    }

    if (level === 75) {
      rewards.push({
        id: `reward_lvl_${level}`,
        title: 'Título: Lenda Musical',
        description: 'Alcançou o panteão lendário do NeonFlow!',
        badgeIcon: '🌟',
        type: 'title',
        unlockedAt: Date.now(),
      });
    }

    return rewards;
  }
}
