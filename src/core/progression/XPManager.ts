import { XPEvent, MemberProgress, XPCalculationResult } from './types';
import { getProgressionConfig } from './progressionConfig';

export class XPManager {
  /**
   * Calculates XP breakdown across Individual, Family, and Session tiers.
   * All values are strictly derived from progressionConfig.
   */
  static calculate(
    event: XPEvent,
    memberProgress?: MemberProgress | null
  ): XPCalculationResult {
    const config = getProgressionConfig();
    const breakdownNotes: string[] = [];

    // ================= 1. INDIVIDUAL XP =================
    let rawIndividualXp = 0;

    switch (event.type) {
      case 'TRACK_FINISHED':
        rawIndividualXp = config.individual.trackFinished;
        breakdownNotes.push(`Música completa: +${rawIndividualXp} XP`);
        break;
      case 'TRACK_LIKED':
        rawIndividualXp = config.individual.trackLiked;
        breakdownNotes.push(`Música curtida: +${rawIndividualXp} XP`);
        break;
      case 'TRACK_ADDED':
      case 'TRACK_REGISTERED':
        rawIndividualXp = config.individual.trackAdded;
        breakdownNotes.push(`Música cadastrada na biblioteca: +${rawIndividualXp} XP`);
        break;
      case 'PLAYLIST_CREATED':
        rawIndividualXp = config.individual.playlistCreated;
        breakdownNotes.push(`Playlist criada: +${rawIndividualXp} XP`);
        break;
      case 'MEMBER_JOINED_SESSION':
        rawIndividualXp = config.individual.memberJoinedSession;
        breakdownNotes.push(`Entrou na sessão: +${rawIndividualXp} XP`);
        break;
      case 'SESSION_FINISHED':
        rawIndividualXp = config.individual.sessionFinished;
        breakdownNotes.push(`Concluiu a sessão: +${rawIndividualXp} XP`);
        break;
      case 'TRACK_LISTENED_BY_ALL':
        rawIndividualXp = config.individual.trackListenedByAllBonus;
        breakdownNotes.push(`Música ouvida por todos os membros: +${rawIndividualXp} XP`);
        break;
      case 'TRACK_DISCOVERED':
        rawIndividualXp = config.individual.discoveryBonus;
        breakdownNotes.push(`Música descoberta em primeira mão: +${rawIndividualXp} XP`);
        break;
      case 'UNANIMOUS_LIKES':
        rawIndividualXp = config.individual.unanimousLikesBonus;
        breakdownNotes.push(`Curtida unânime de todos os membros: +${rawIndividualXp} XP`);
        break;
      case 'PERFECT_SESSION_NO_SKIPS':
        rawIndividualXp = config.individual.noSkipsSessionBonus;
        breakdownNotes.push(`Sessão perfeita sem pulos: +${rawIndividualXp} XP`);
        break;
      case 'LONG_SESSION_COMPLETED':
        rawIndividualXp = config.individual.longSessionBonus;
        breakdownNotes.push(`Sessão longa (30+ min): +${rawIndividualXp} XP`);
        break;
    }

    // Contributor bonus if member uploaded/registered the track being played
    if (event.payload?.isTrackContributor) {
      const contribBonus = config.session.trackContributorBonus;
      rawIndividualXp += contribBonus;
      breakdownNotes.push(`Bônus de cadastrador da faixa: +${contribBonus} XP`);
    }

    // Discovery bonus payload check
    if (event.payload?.isDiscovery && event.type !== 'TRACK_DISCOVERED') {
      const discBonus = config.individual.discoveryBonus;
      rawIndividualXp += discBonus;
      breakdownNotes.push(`Bônus por descobrir nova faixa: +${discBonus} XP`);
    }

    // Unanimous likes payload check
    if (event.payload?.isUnanimousLikes && event.type !== 'UNANIMOUS_LIKES') {
      const unanBonus = config.individual.unanimousLikesBonus;
      rawIndividualXp += unanBonus;
      breakdownNotes.push(`Bônus de sintonia unânime: +${unanBonus} XP`);
    }

    // Daily Streak Multiplier
    let streakMultiplier = 1.0;
    if (memberProgress && memberProgress.streakDays > 1) {
      const step = config.streak.dailyStreakMultiplierStep;
      const maxBonus = config.streak.maxStreakMultiplierBonus;
      const bonus = Math.min(maxBonus, (memberProgress.streakDays - 1) * step);
      streakMultiplier += bonus;
      breakdownNotes.push(`Multiplicador de ofensiva (${memberProgress.streakDays} dias): x${streakMultiplier.toFixed(2)}`);
    }

    const individualXp = Math.round(rawIndividualXp * streakMultiplier);

    // ================= 2. FAMILY XP =================
    let familyXp = 0;

    switch (event.type) {
      case 'EVERYONE_LISTENING_TOGETHER':
        familyXp = config.family.everyoneListeningTogether;
        breakdownNotes.push(`Todos ouvindo juntos em sintonia: +${familyXp} XP de Família`);
        break;
      case 'FAMILY_SESSION_COMPLETED':
        familyXp = config.family.familySessionCompleted;
        breakdownNotes.push(`Sessão familiar concluída: +${familyXp} XP de Família`);
        break;
      case 'FIRST_SESSION_OF_DAY':
        familyXp = config.family.firstSessionOfDay;
        breakdownNotes.push(`Primeira sessão do dia: +${familyXp} XP de Família`);
        break;
      case 'FIRST_SONG_OF_DAY':
        familyXp = config.family.firstSongOfDay;
        breakdownNotes.push(`Primeira música do dia: +${familyXp} XP de Família`);
        break;
      case 'SHARED_PLAYLIST_CREATED':
        familyXp = config.family.sharedPlaylistCreated;
        breakdownNotes.push(`Nova playlist compartilhada: +${familyXp} XP de Família`);
        break;
      case 'DISCOVERY_TRACK_ADDED':
        familyXp = config.family.discoveryTrackAdded;
        breakdownNotes.push(`Nova música descoberta para a família: +${familyXp} XP de Família`);
        break;
      case 'FAMILY_FIRST_PLAY':
        familyXp = config.family.familyFirstPlay;
        breakdownNotes.push(`Primeira vez que a família ouve esta faixa: +${familyXp} XP de Família`);
        break;
    }

    if (event.payload?.isFamilyFirstPlay && event.type !== 'FAMILY_FIRST_PLAY') {
      const ffpBonus = config.family.familyFirstPlay;
      familyXp += ffpBonus;
      breakdownNotes.push(`Primeira execução na história da família: +${ffpBonus} XP de Família`);
    }

    // ================= 3. SESSION XP =================
    let sessionXp = 0;
    let roleMultiplier = 1.0;

    if (event.sessionId) {
      let baseSessionXp = 0;

      if (event.type === 'TRACK_FINISHED' || event.type === 'TRACK_STARTED') {
        baseSessionXp += config.session.basePerTrackPlayed;
      }

      // Session Duration XP
      if (event.payload?.durationMinutes && event.payload.durationMinutes > 0) {
        const durXp = Math.round(event.payload.durationMinutes * config.session.xpPerDurationMinute);
        baseSessionXp += durXp;
        breakdownNotes.push(`Duração da sessão (${event.payload.durationMinutes} min): +${durXp} XP`);
      }

      // Likes bonus in session
      if (event.payload?.likesCount && event.payload.likesCount > 0) {
        const likeXp = event.payload.likesCount * config.session.likeBonusInSession;
        baseSessionXp += likeXp;
        breakdownNotes.push(`Curtidas da sessão (${event.payload.likesCount}): +${likeXp} XP`);
      }

      // Skips penalty in session
      if (event.payload?.skipsCount && event.payload.skipsCount > 0) {
        const skipPenalty = event.payload.skipsCount * config.session.skipPenaltyInSession;
        baseSessionXp = Math.max(0, baseSessionXp + skipPenalty);
        breakdownNotes.push(`Pulos na sessão (${event.payload.skipsCount}): ${skipPenalty} XP`);
      }

      // Participant count multiplier
      const participantCount = event.payload?.participantCount || 1;
      let participantMultiplier =
        1 + Math.max(0, participantCount - 1) * config.session.participantMultiplierPerMember;

      // Collective listening boost if everyone is in sync
      if (event.type === 'EVERYONE_LISTENING_TOGETHER' || participantCount >= 3) {
        participantMultiplier *= config.session.everyoneTogetherMultiplier;
        breakdownNotes.push(`Multiplicador Coletivo (Família Unida): x${config.session.everyoneTogetherMultiplier.toFixed(2)}`);
      }

      // Controller vs Participant Role Multiplier
      if (event.payload?.isController === true) {
        roleMultiplier = config.session.controllerRoleMultiplier;
        breakdownNotes.push(`Papel Controlador da Sessão: x${roleMultiplier.toFixed(2)}`);
      } else if (event.payload?.isController === false) {
        roleMultiplier = config.session.participantRoleMultiplier;
        breakdownNotes.push(`Papel Participante Ativo: x${roleMultiplier.toFixed(2)}`);
      }

      sessionXp = Math.round(baseSessionXp * participantMultiplier * roleMultiplier);
    }

    const totalXp = Math.max(0, individualXp + familyXp + sessionXp);

    return {
      individualXp,
      familyXp,
      sessionXp,
      totalXp,
      roleMultiplierApplied: roleMultiplier,
      streakMultiplierApplied: streakMultiplier,
      breakdownNotes,
    };
  }
}
