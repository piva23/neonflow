import {
  AchievementItem,
  AchievementRarity,
  Reward,
} from './types';

export interface RarityMetadata {
  name: AchievementRarity;
  borderHex: string;
  bgGradient: string;
  badgeSuffix: string;
  xpBonus: number;
}

export class BadgeEngine {
  private static RARITY_CONFIG: Record<AchievementRarity, RarityMetadata> = {
    Bronze: {
      name: 'Bronze',
      borderHex: '#CD7F32',
      bgGradient: 'from-amber-700 to-yellow-900',
      badgeSuffix: '🥉',
      xpBonus: 0,
    },
    Prata: {
      name: 'Prata',
      borderHex: '#C0C0C0',
      bgGradient: 'from-slate-300 to-slate-500',
      badgeSuffix: '🥈',
      xpBonus: 50,
    },
    Ouro: {
      name: 'Ouro',
      borderHex: '#FFD700',
      bgGradient: 'from-amber-300 to-yellow-500',
      badgeSuffix: '🥇',
      xpBonus: 100,
    },
    Platina: {
      name: 'Platina',
      borderHex: '#E5E4E2',
      bgGradient: 'from-cyan-200 to-blue-400',
      badgeSuffix: '💎',
      xpBonus: 250,
    },
    Lendário: {
      name: 'Lendário',
      borderHex: '#FF007F',
      bgGradient: 'from-fuchsia-500 via-purple-600 to-pink-500',
      badgeSuffix: '👑',
      xpBonus: 500,
    },
  };

  /**
   * Returns visual and metadata properties for an achievement rarity tier
   */
  static getRarityMetadata(rarity: AchievementRarity): RarityMetadata {
    return this.RARITY_CONFIG[rarity] || this.RARITY_CONFIG.Bronze;
  }

  /**
   * Converts an unlocked Achievement into a player Reward badge object
   */
  static createBadgeReward(achievement: AchievementItem): Reward {
    const rarityMeta = this.getRarityMetadata(achievement.raridade);

    return {
      id: `reward_badge_${achievement.id}_${Date.now()}`,
      title: `${achievement.nome} ${rarityMeta.badgeSuffix}`,
      description: `${achievement.descrição} [Conquista ${achievement.raridade}]`,
      badgeIcon: achievement.ícone,
      type: 'badge',
      unlockedAt: achievement.progresso.unlockedAt || Date.now(),
      rarity: achievement.raridade,
    };
  }
}
