import {
  AchievementItem,
  AchievementCategory,
  AchievementRarity,
  MemberProgress,
  MemberProgressStats,
  XPEvent,
  Reward,
} from './types';
import { MilestoneEngine } from './MilestoneEngine';
import { BadgeEngine } from './BadgeEngine';

export class AchievementEngine {
  private static instance: AchievementEngine;

  private catalog: Omit<AchievementItem, 'progresso'>[] = [
    // ================= CATEGORIA: MÚSICAS =================
    {
      id: 'ach_first_song',
      nome: 'Primeira Música',
      descrição: 'Ouça sua primeira música completa na plataforma.',
      categoria: 'Músicas',
      ícone: '🎵',
      raridade: 'Bronze',
      xp: 20,
      condição: 'stats.tracksFinished >= 1',
    },
    {
      id: 'ach_10_songs',
      nome: '10 Músicas',
      descrição: 'Ouça 10 músicas do início ao fim.',
      categoria: 'Músicas',
      ícone: '🎧',
      raridade: 'Bronze',
      xp: 40,
      condição: 'stats.tracksFinished >= 10',
    },
    {
      id: 'ach_100_songs',
      nome: '100 Músicas',
      descrição: 'Ouça 100 músicas na biblioteca familiar.',
      categoria: 'Músicas',
      ícone: '🎶',
      raridade: 'Prata',
      xp: 150,
      condição: 'stats.tracksFinished >= 100',
    },
    {
      id: 'ach_1000_songs',
      nome: '1000 Músicas',
      descrição: 'Alcance a marca lendária de 1000 músicas ouvidas.',
      categoria: 'Músicas',
      ícone: '🌟',
      raridade: 'Lendário',
      xp: 800,
      condição: 'stats.tracksFinished >= 1000',
    },
    {
      id: 'ach_first_liked',
      nome: 'Primeira Música Curtida',
      descrição: 'Curta sua primeira faixa musical.',
      categoria: 'Músicas',
      ícone: '❤️',
      raridade: 'Bronze',
      xp: 15,
      condição: 'stats.tracksLiked >= 1',
    },
    {
      id: 'ach_100_liked',
      nome: '100 Curtidas',
      descrição: 'Demonstre amor à música curtindo 100 faixas.',
      categoria: 'Músicas',
      ícone: '💖',
      raridade: 'Ouro',
      xp: 200,
      condição: 'stats.tracksLiked >= 100',
    },
    {
      id: 'ach_first_added',
      nome: 'Primeira Música Adicionada',
      descrição: 'Cadastre sua primeira música na biblioteca.',
      categoria: 'Músicas',
      ícone: '➕',
      raridade: 'Bronze',
      xp: 20,
      condição: 'stats.tracksAdded >= 1',
    },

    // ================= CATEGORIA: PLAYLISTS =================
    {
      id: 'ach_first_playlist',
      nome: 'Primeira Playlist',
      descrição: 'Crie sua primeira playlist na plataforma.',
      categoria: 'Playlists',
      ícone: '📑',
      raridade: 'Bronze',
      xp: 30,
      condição: 'stats.playlistsCreated >= 1',
    },
    {
      id: 'ach_playlist_100_songs',
      nome: 'Playlist com 100 Músicas',
      descrição: 'Monte uma megaplaylist contendo 100 faixas.',
      categoria: 'Playlists',
      ícone: '💿',
      raridade: 'Platina',
      xp: 350,
      condição: 'stats.maxPlaylistSize >= 100',
    },

    // ================= CATEGORIA: SESSÕES =================
    {
      id: 'ach_first_session',
      nome: 'Primeira Sessão',
      descrição: 'Participe da sua primeira sessão musical compartilhada.',
      categoria: 'Sessões',
      ícone: '📻',
      raridade: 'Bronze',
      xp: 25,
      condição: 'stats.sessionsParticipated >= 1',
    },
    {
      id: 'ach_10_sessions',
      nome: '10 Sessões',
      descrição: 'Conclua a participação em 10 sessões familiares.',
      categoria: 'Sessões',
      ícone: '🎛️',
      raridade: 'Prata',
      xp: 120,
      condição: 'stats.sessionsParticipated >= 10',
    },
    {
      id: 'ach_100_sessions',
      nome: '100 Sessões',
      descrição: 'Participe ativamente de 100 sessões em grupo.',
      categoria: 'Sessões',
      ícone: '🔮',
      raridade: 'Platina',
      xp: 500,
      condição: 'stats.sessionsParticipated >= 100',
    },

    // ================= CATEGORIA: FAMÍLIA =================
    {
      id: 'ach_everyone_together',
      nome: 'Todos Ouviram Juntos',
      descrição: 'Sincronize a audição simultânea com todos os membros da família.',
      categoria: 'Família',
      ícone: '👨‍👩‍👧‍👦',
      raridade: 'Ouro',
      xp: 200,
      condição: 'stats.everyoneTogetherCount >= 1',
    },
    {
      id: 'ach_streak_5',
      nome: '5 Dias Seguidos',
      descrição: 'Mantenha uma ofensiva musical por 5 dias consecutivos.',
      categoria: 'Família',
      ícone: '🔥',
      raridade: 'Prata',
      xp: 100,
      condição: 'streakDays >= 5',
    },
    {
      id: 'ach_streak_30',
      nome: '30 Dias Seguidos',
      descrição: 'Mantenha uma chama inabalável por 30 dias de ofensiva.',
      categoria: 'Família',
      ícone: '⚡',
      raridade: 'Platina',
      xp: 400,
      condição: 'streakDays >= 30',
    },

    // ================= CATEGORIA: DESCOBERTAS =================
    {
      id: 'ach_first_discovery',
      nome: 'Primeira Descoberta',
      descrição: 'Adicione uma música descoberta à biblioteca familiar.',
      categoria: 'Descobertas',
      ícone: '🔍',
      raridade: 'Bronze',
      xp: 30,
      condição: 'stats.discoveriesCount >= 1',
    },
    {
      id: 'ach_10_discoveries',
      nome: '10 Descobertas',
      descrição: 'Apresente 10 faixas inéditas descobertas para a família.',
      categoria: 'Descobertas',
      ícone: '🚀',
      raridade: 'Ouro',
      xp: 220,
      condição: 'stats.discoveriesCount >= 10',
    },

    // ================= CATEGORIA: TEMPO OUVIDO =================
    {
      id: 'ach_1_hour',
      nome: '1 Hora Ouvida',
      descrição: 'Complete 60 minutos de reprodução acumulada.',
      categoria: 'Tempo ouvido',
      ícone: '⏱️',
      raridade: 'Bronze',
      xp: 35,
      condição: 'stats.totalMinutesListened >= 60',
    },
    {
      id: 'ach_10_hours',
      nome: '10 Horas Ouvidas',
      descrição: 'Alcance 10 horas (600 minutos) ouvindo música.',
      categoria: 'Tempo ouvido',
      ícone: '⏳',
      raridade: 'Prata',
      xp: 180,
      condição: 'stats.totalMinutesListened >= 600',
    },
    {
      id: 'ach_100_hours',
      nome: '100 Horas Ouvidas',
      descrição: 'Complete 100 horas (6000 minutos) de imersão sonora.',
      categoria: 'Tempo ouvido',
      ícone: '🌌',
      raridade: 'Lendário',
      xp: 1000,
      condição: 'stats.totalMinutesListened >= 6000',
    },

    // ================= CATEGORIA: CONQUISTAS OCULTAS =================
    {
      id: 'ach_secret_night_owl',
      nome: 'Coruja Noturna',
      descrição: 'Ouça músicas durante a madrugada (entre 02:00 e 05:00 da manhã).',
      categoria: 'Músicas',
      ícone: '🦉',
      raridade: 'Ouro',
      xp: 150,
      condição: 'stats.nightSessionsCount >= 1',
      isSecret: true,
    },
    {
      id: 'ach_secret_flawless',
      nome: 'Vibe Inabalável',
      descrição: 'Conclua uma sessão de no mínimo 30 minutos sem pular nenhuma música.',
      categoria: 'Sessões',
      ícone: '💎',
      raridade: 'Platina',
      xp: 300,
      condição: 'stats.noSkipSessionsCount >= 1',
      isSecret: true,
    },
    {
      id: 'ach_secret_unanimous',
      nome: 'Sintonia Absoluta',
      descrição: 'Toque uma música que foi curtida simultaneamente por 100% da família.',
      categoria: 'Família',
      ícone: '✨',
      raridade: 'Ouro',
      xp: 250,
      condição: 'stats.unanimousLikesCount >= 1',
      isSecret: true,
    },
    {
      id: 'ach_secret_encyclopedia',
      nome: 'Enciclopédia Humana',
      descrição: 'Cadastre mais de 25 músicas inéditas na biblioteca familiar.',
      categoria: 'Descobertas',
      ícone: '📖',
      raridade: 'Lendário',
      xp: 600,
      condição: 'stats.tracksAdded >= 25',
      isSecret: true,
    },
    {
      id: 'ach_secret_marathon',
      nome: 'Maratona Familiar',
      descrição: 'Atingiu mais de 120 minutos de reprodução em uma única sessão compartilhada.',
      categoria: 'Tempo ouvido',
      ícone: '🏅',
      raridade: 'Platina',
      xp: 400,
      condição: 'stats.longSessionsCount >= 1',
      isSecret: true,
    },
  ];

  public static getInstance(): AchievementEngine {
    if (!AchievementEngine.instance) {
      AchievementEngine.instance = new AchievementEngine();
    }
    return AchievementEngine.instance;
  }

  /**
   * Get target value for a specific achievement ID
   */
  private getTargetValue(id: string): number {
    switch (id) {
      case 'ach_first_song': return 1;
      case 'ach_10_songs': return 10;
      case 'ach_100_songs': return 100;
      case 'ach_1000_songs': return 1000;
      case 'ach_first_liked': return 1;
      case 'ach_100_liked': return 100;
      case 'ach_first_added': return 1;
      case 'ach_first_playlist': return 1;
      case 'ach_playlist_100_songs': return 100;
      case 'ach_first_session': return 1;
      case 'ach_10_sessions': return 10;
      case 'ach_100_sessions': return 100;
      case 'ach_everyone_together': return 1;
      case 'ach_streak_5': return 5;
      case 'ach_streak_30': return 30;
      case 'ach_first_discovery': return 1;
      case 'ach_10_discoveries': return 10;
      case 'ach_1_hour': return 60;
      case 'ach_10_hours': return 600;
      case 'ach_100_hours': return 6000;

      // Secret achievements target values
      case 'ach_secret_night_owl': return 1;
      case 'ach_secret_flawless': return 1;
      case 'ach_secret_unanimous': return 1;
      case 'ach_secret_encyclopedia': return 25;
      case 'ach_secret_marathon': return 1;
      default: return 1;
    }
  }

  /**
   * Extracts current metric value for a specific achievement
   */
  private getCurrentMetricValue(id: string, progress: MemberProgress): number {
    const stats: Partial<MemberProgressStats> = progress.stats || {};
    switch (id) {
      case 'ach_first_song':
      case 'ach_10_songs':
      case 'ach_100_songs':
      case 'ach_1000_songs':
        return stats.tracksFinished || 0;

      case 'ach_first_liked':
      case 'ach_100_liked':
        return stats.tracksLiked || 0;

      case 'ach_first_added':
      case 'ach_secret_encyclopedia':
        return stats.tracksAdded || 0;

      case 'ach_first_playlist':
        return stats.playlistsCreated || 0;

      case 'ach_playlist_100_songs':
        return stats.maxPlaylistSize || 0;

      case 'ach_first_session':
      case 'ach_10_sessions':
      case 'ach_100_sessions':
        return stats.sessionsParticipated || 0;

      case 'ach_everyone_together':
        return stats.everyoneTogetherCount || 0;

      case 'ach_streak_5':
      case 'ach_streak_30':
        return progress.streakDays || 0;

      case 'ach_first_discovery':
      case 'ach_10_discoveries':
        return stats.discoveriesCount || 0;

      case 'ach_1_hour':
      case 'ach_10_hours':
      case 'ach_100_hours':
        return stats.totalMinutesListened || 0;

      case 'ach_secret_flawless':
        return stats.noSkipSessionsCount || 0;

      case 'ach_secret_unanimous':
        return stats.unanimousLikesCount || 0;

      case 'ach_secret_marathon':
        return stats.longSessionsCount || 0;

      default:
        return 0;
    }
  }

  /**
   * Returns list of all achievement definitions with current member progress
   */
  public getAchievementsForMember(
    memberProgress: MemberProgress
  ): AchievementItem[] {
    const detailed = memberProgress.detailedAchievements || {};

    return this.catalog.map((def) => {
      const existing = detailed[def.id];
      const targetValue = this.getTargetValue(def.id);
      const currentValue = this.getCurrentMetricValue(def.id, memberProgress);
      const wasCompletedBefore = existing?.progresso?.completed || false;
      const unlockedAt = existing?.progresso?.unlockedAt;

      const progresso = MilestoneEngine.calculateProgress(
        currentValue,
        targetValue,
        wasCompletedBefore,
        unlockedAt
      );

      return {
        ...def,
        progresso,
      };
    });
  }

  /**
   * Evaluates all achievements for member given an incoming event.
   * Updates stats and returns newly unlocked achievements & badges.
   */
  public evaluate(
    memberProgress: MemberProgress,
    event: XPEvent
  ): {
    updatedMemberProgress: MemberProgress;
    unlockedAchievements: AchievementItem[];
    newRewards: Reward[];
    bonusXpAwarded: number;
  } {
    const progress: MemberProgress = JSON.parse(JSON.stringify(memberProgress));
    if (!progress.stats) {
      progress.stats = {
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
        unanimousLikesCount: 0,
        noSkipSessionsCount: 0,
        longSessionsCount: 0,
        familyFirstPlaysCount: 0,
        tracksRegisteredCount: 0,
        secretAchievementsUnlocked: 0,
      };
    }
    if (!progress.detailedAchievements) {
      progress.detailedAchievements = {};
    }

    // 1. Update stats from event
    switch (event.type) {
      case 'TRACK_STARTED':
        progress.stats.tracksPlayed = (progress.stats.tracksPlayed || 0) + 1;
        break;
      case 'TRACK_FINISHED':
        progress.stats.tracksFinished = (progress.stats.tracksFinished || 0) + 1;
        const trackMin = event.payload?.durationMinutes || 3;
        progress.stats.totalMinutesListened = (progress.stats.totalMinutesListened || 0) + trackMin;
        break;
      case 'TRACK_LIKED':
        progress.stats.tracksLiked = (progress.stats.tracksLiked || 0) + 1;
        break;
      case 'TRACK_ADDED':
      case 'TRACK_REGISTERED':
        progress.stats.tracksAdded = (progress.stats.tracksAdded || 0) + 1;
        progress.stats.tracksRegisteredCount = (progress.stats.tracksRegisteredCount || 0) + 1;
        break;
      case 'PLAYLIST_CREATED':
        progress.stats.playlistsCreated = (progress.stats.playlistsCreated || 0) + 1;
        if (event.payload?.playlistTrackCount) {
          progress.stats.maxPlaylistSize = Math.max(
            progress.stats.maxPlaylistSize || 0,
            event.payload.playlistTrackCount
          );
        }
        break;
      case 'MEMBER_JOINED_SESSION':
      case 'FIRST_SESSION_OF_DAY':
        progress.stats.sessionsParticipated = (progress.stats.sessionsParticipated || 0) + 1;
        break;
      case 'EVERYONE_LISTENING_TOGETHER':
        progress.stats.everyoneTogetherCount = (progress.stats.everyoneTogetherCount || 0) + 1;
        break;
      case 'DISCOVERY_TRACK_ADDED':
      case 'TRACK_DISCOVERED':
        progress.stats.discoveriesCount = (progress.stats.discoveriesCount || 0) + 1;
        break;
      case 'UNANIMOUS_LIKES':
        progress.stats.unanimousLikesCount = (progress.stats.unanimousLikesCount || 0) + 1;
        break;
      case 'PERFECT_SESSION_NO_SKIPS':
        progress.stats.noSkipSessionsCount = (progress.stats.noSkipSessionsCount || 0) + 1;
        break;
      case 'LONG_SESSION_COMPLETED':
        progress.stats.longSessionsCount = (progress.stats.longSessionsCount || 0) + 1;
        break;
      case 'FAMILY_FIRST_PLAY':
        progress.stats.familyFirstPlaysCount = (progress.stats.familyFirstPlaysCount || 0) + 1;
        break;
    }

    // Additional checks from event payload
    if (event.payload?.isDiscovery) {
      progress.stats.discoveriesCount = (progress.stats.discoveriesCount || 0) + 1;
    }
    if (event.payload?.isUnanimousLikes) {
      progress.stats.unanimousLikesCount = (progress.stats.unanimousLikesCount || 0) + 1;
    }
    if (event.payload?.hasNoSkips) {
      progress.stats.noSkipSessionsCount = (progress.stats.noSkipSessionsCount || 0) + 1;
    }
    if (event.payload?.isLongSession) {
      progress.stats.longSessionsCount = (progress.stats.longSessionsCount || 0) + 1;
    }

    // 2. Evaluate all catalog items against new stats
    const unlockedAchievements: AchievementItem[] = [];
    const newRewards: Reward[] = [];
    let bonusXpAwarded = 0;

    this.catalog.forEach((def) => {
      const existingState = progress.detailedAchievements![def.id];
      const targetValue = this.getTargetValue(def.id);
      const currentValue = this.getCurrentMetricValue(def.id, progress);
      const wasCompleted = existingState?.progresso?.completed || false;

      const freshlyUnlocked = MilestoneEngine.isFreshlyCompleted(
        currentValue,
        targetValue,
        wasCompleted
      );

      const progresso = MilestoneEngine.calculateProgress(
        currentValue,
        targetValue,
        wasCompleted || freshlyUnlocked,
        existingState?.progresso?.unlockedAt || (freshlyUnlocked ? Date.now() : undefined)
      );

      const updatedItem: AchievementItem = {
        ...def,
        progresso,
      };

      progress.detailedAchievements![def.id] = updatedItem;

      if (freshlyUnlocked) {
        unlockedAchievements.push(updatedItem);
        bonusXpAwarded += def.xp;
        if (def.isSecret) {
          progress.stats.secretAchievementsUnlocked = (progress.stats.secretAchievementsUnlocked || 0) + 1;
        }

        // Generate Badge Reward
        const badgeReward = BadgeEngine.createBadgeReward(updatedItem);
        newRewards.push(badgeReward);
        progress.unlockedRewards.push(badgeReward);
      }
    });

    return {
      updatedMemberProgress: progress,
      unlockedAchievements,
      newRewards,
      bonusXpAwarded,
    };
  }
}

export const achievementEngine = AchievementEngine.getInstance();
