import { MemberProgress, AchievementProgress, Reward, XPEvent } from './types';

export class RewardManager {
  /**
   * Initializes default achievements for a new member progress object
   */
  static getDefaultAchievements(): Record<string, AchievementProgress> {
    return {
      first_song: {
        id: 'ach_first_song',
        key: 'first_song',
        title: 'Primeiro Acorde',
        description: 'Tocou sua primeira música na plataforma.',
        currentValue: 0,
        targetValue: 1,
        completed: false,
        rewardBadge: '🎵',
      },
      music_lover: {
        id: 'ach_music_lover',
        key: 'music_lover',
        title: 'Ouvinte Apaixonado',
        description: 'Ouviu 25 músicas do início ao fim.',
        currentValue: 0,
        targetValue: 25,
        completed: false,
        rewardBadge: '🎧',
      },
      dj_master: {
        id: 'ach_dj_master',
        key: 'dj_master',
        title: 'DJ da Família',
        description: 'Criou 3 playlists para a biblioteca familiar.',
        currentValue: 0,
        targetValue: 3,
        completed: false,
        rewardBadge: '🎛️',
      },
      social_harmony: {
        id: 'ach_social_harmony',
        key: 'social_harmony',
        title: 'Sintonia Familiar',
        description: 'Participou de 5 sessões musicais com a família.',
        currentValue: 0,
        targetValue: 5,
        completed: false,
        rewardBadge: '✨',
      },
      super_collector: {
        id: 'ach_super_collector',
        key: 'super_collector',
        title: 'Curador Musical',
        description: 'Adicionou 10 faixas à biblioteca.',
        currentValue: 0,
        targetValue: 10,
        completed: false,
        rewardBadge: '📚',
      },
    };
  }

  /**
   * Evaluates achievements based on incoming event and updates MemberProgress stats
   */
  static evaluateAchievements(
    memberProgress: MemberProgress,
    event: XPEvent
  ): { updatedProgress: MemberProgress; newlyUnlocked: Reward[] } {
    const progress = JSON.parse(JSON.stringify(memberProgress)) as MemberProgress;
    const newlyUnlocked: Reward[] = [];

    if (!progress.achievements || Object.keys(progress.achievements).length === 0) {
      progress.achievements = this.getDefaultAchievements();
    }

    // 1. Update stats based on event type
    switch (event.type) {
      case 'TRACK_STARTED':
        progress.stats.tracksPlayed = (progress.stats.tracksPlayed || 0) + 1;
        break;
      case 'TRACK_FINISHED':
        progress.stats.tracksFinished = (progress.stats.tracksFinished || 0) + 1;
        break;
      case 'TRACK_LIKED':
        progress.stats.tracksLiked = (progress.stats.tracksLiked || 0) + 1;
        break;
      case 'TRACK_ADDED':
        progress.stats.tracksAdded = (progress.stats.tracksAdded || 0) + 1;
        break;
      case 'PLAYLIST_CREATED':
        progress.stats.playlistsCreated = (progress.stats.playlistsCreated || 0) + 1;
        break;
      case 'MEMBER_JOINED_SESSION':
      case 'FIRST_SESSION_OF_DAY':
        progress.stats.sessionsParticipated = (progress.stats.sessionsParticipated || 0) + 1;
        break;
    }

    // 2. Evaluate achievement logic
    const checkAchievement = (
      key: string,
      currentValue: number,
      title: string,
      badge: string
    ) => {
      const ach = progress.achievements[key];
      if (ach && !ach.completed) {
        ach.currentValue = currentValue;
        if (ach.currentValue >= ach.targetValue) {
          ach.completed = true;
          ach.unlockedAt = Date.now();

          const newReward: Reward = {
            id: `reward_ach_${key}_${Date.now()}`,
            title,
            description: ach.description,
            badgeIcon: badge,
            type: 'badge',
            unlockedAt: Date.now(),
          };

          progress.unlockedRewards.push(newReward);
          newlyUnlocked.push(newReward);
        }
      }
    };

    checkAchievement('first_song', progress.stats.tracksPlayed, 'Primeiro Acorde', '🎵');
    checkAchievement('music_lover', progress.stats.tracksFinished, 'Ouvinte Apaixonado', '🎧');
    checkAchievement('dj_master', progress.stats.playlistsCreated, 'DJ da Família', '🎛️');
    checkAchievement('social_harmony', progress.stats.sessionsParticipated, 'Sintonia Familiar', '✨');
    checkAchievement('super_collector', progress.stats.tracksAdded, 'Curador Musical', '📚');

    return { updatedProgress: progress, newlyUnlocked };
  }
}
