import {
  TrackStory,
  TimelineEvent,
  TimelineEventType,
  MemberFavoriteMemory,
  TrackStoryMemberRef,
} from './types';
import { MemoriesStorage } from './MemoriesStorage';

export class MusicalMemoriesEngine {
  private static instance: MusicalMemoriesEngine;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): MusicalMemoriesEngine {
    if (!MusicalMemoriesEngine.instance) {
      MusicalMemoriesEngine.instance = new MusicalMemoriesEngine();
    }
    return MusicalMemoriesEngine.instance;
  }

  /**
   * Initialize memory system
   */
  public init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;
  }

  /**
   * Main automatic entry point when a track is played / finished
   */
  public recordTrackPlay(params: {
    trackId: string;
    trackTitle: string;
    artist: string;
    album?: string;
    thumbnail?: string;
    durationSeconds?: number;
    memberId: string;
    memberName?: string;
    familyId?: string;
    sessionId?: string;
    isFamilySession?: boolean;
    contextTags?: string[];
    allFamilyMembers?: TrackStoryMemberRef[];
  }): TrackStory {
    this.init();

    const {
      trackId,
      trackTitle,
      artist,
      album,
      thumbnail,
      durationSeconds = 200,
      memberId,
      familyId = 'f-1',
      sessionId,
      isFamilySession,
      contextTags = [],
      allFamilyMembers = [],
    } = params;

    const now = Date.now();
    const resolvedMemberName = params.memberName || `Membro (${memberId})`;

    // Load or initialize TrackStory
    let story = MemoriesStorage.loadTrackStory(trackId);
    const isFirstTimeEver = !story;

    if (!story) {
      story = {
        trackId,
        trackTitle,
        artist,
        album,
        thumbnail,
        duration: durationSeconds,
        firstHeardAt: now,
        lastHeardAt: now,
        presentedBy: {
          memberId,
          memberName: resolvedMemberName,
          timestamp: now,
        },
        playCount: 0,
        totalDurationSeconds: 0,
        playCountByMember: {},
        durationByMember: {},
        topListener: null,
        neverListenedMembers: [],
        specialContexts: [],
        milestones: [
          {
            id: `ms-${now}-first`,
            timestamp: now,
            title: 'Música Apresentada',
            description: `${resolvedMemberName} apresentou "${trackTitle}" para a biblioteca da família.`,
            icon: '🎵',
            memberId,
            memberName: resolvedMemberName,
          },
        ],
      };
    }

    // Update timestamps & stats
    story.lastHeardAt = now;
    story.playCount += 1;
    story.totalDurationSeconds += durationSeconds;
    story.playCountByMember[memberId] = (story.playCountByMember[memberId] || 0) + 1;
    story.durationByMember[memberId] = (story.durationByMember[memberId] || 0) + durationSeconds;

    // Recalculate Top Listener
    let topMemberId = memberId;
    let maxPlays = 0;
    Object.entries(story.playCountByMember).forEach(([mId, count]) => {
      if (count > maxPlays) {
        maxPlays = count;
        topMemberId = mId;
      }
    });

    const topMemberName = topMemberId === memberId ? resolvedMemberName : topMemberId;

    story.topListener = {
      memberId: topMemberId,
      memberName: topMemberName,
      playCount: maxPlays,
    };

    // Calculate Never Listened Members
    if (allFamilyMembers.length > 0) {
      story.neverListenedMembers = allFamilyMembers.filter(
        (m) => !story!.playCountByMember[m.memberId] || story!.playCountByMember[m.memberId] === 0
      );
    } else {
      story.neverListenedMembers = [];
    }

    // Contextual Memories: Family First Time
    if ((isFamilySession || contextTags.includes('familia')) && !story.firstTimeFamilyAt) {
      story.firstTimeFamilyAt = now;
      story.specialContexts.push({
        id: `ctx-${now}-family`,
        type: 'primeira_vez_familia',
        label: 'Primeira reprodução em família',
        timestamp: now,
        details: 'Toda a família ouviu junta.',
      });

      story.milestones.push({
        id: `ms-${now}-family`,
        timestamp: now,
        title: 'Primeira Vez em Família',
        description: `Toda a família ouviu "${trackTitle}" junta.`,
        icon: '👨‍👩‍👧‍👦',
      });

      MemoriesStorage.addTimelineEvent(familyId, {
        id: `tl-${now}-family-first`,
        timestamp: now,
        eventType: 'FAMILY_FIRST_PLAY',
        title: `Primeira vez em família: ${trackTitle}`,
        description: `Sintonia compartilhada por todos com ${artist}.`,
        icon: '👨‍👩‍👧‍👦',
        trackId,
        trackTitle,
        artist,
        thumbnail,
        memberId,
        memberName: resolvedMemberName,
        familyId,
      });
    }

    // Contextual Memories: First Session
    if (sessionId && !story.firstSessionId) {
      story.firstSessionId = sessionId;
      story.specialContexts.push({
        id: `ctx-${now}-sess`,
        type: 'primeira_sessao',
        label: 'Primeira Sessão Registrada',
        timestamp: now,
        details: `Tocado na sessão ${sessionId}.`,
      });

      MemoriesStorage.addTimelineEvent(familyId, {
        id: `tl-${now}-sess-first`,
        timestamp: now,
        eventType: 'FIRST_SESSION_PLAY',
        title: `Primeira sessão: ${trackTitle}`,
        description: `Faixa estreada na sessão oficial de música.`,
        icon: '🎧',
        trackId,
        trackTitle,
        artist,
        thumbnail,
        memberId,
        memberName: resolvedMemberName,
        familyId,
      });
    }

    // Contextual Memories: Sundays
    const dateObj = new Date(now);
    const isSunday = dateObj.getDay() === 0 || contextTags.includes('domingo');
    if (isSunday) {
      story.specialContexts.push({
        id: `ctx-${now}-sunday`,
        type: 'domingo',
        label: 'Trilha Sonora do Domingo',
        timestamp: now,
        details: 'Tocada num domingo em família.',
      });

      MemoriesStorage.addTimelineEvent(familyId, {
        id: `tl-${now}-sunday`,
        timestamp: now,
        eventType: 'SUNDAY_SOUNDTRACK',
        title: `Trilha do Domingo: ${trackTitle}`,
        description: `Embalando o dia de descanso da família.`,
        icon: '☀️',
        trackId,
        trackTitle,
        artist,
        thumbnail,
        memberId,
        memberName: resolvedMemberName,
        familyId,
      });
    }

    // Contextual Memories: Roadtrips / Travels
    if (contextTags.includes('viagem') || contextTags.includes('roadtrip')) {
      story.specialContexts.push({
        id: `ctx-${now}-travel`,
        type: 'viagem',
        label: 'Música de Viagem',
        timestamp: now,
        details: 'Trilha registrada durante uma viagem.',
      });

      MemoriesStorage.addTimelineEvent(familyId, {
        id: `tl-${now}-travel`,
        timestamp: now,
        eventType: 'ROADTRIP_HIT',
        title: `Música da Viagem: ${trackTitle}`,
        description: `Marcante nas estradas e aventuras da família.`,
        icon: '🚗',
        trackId,
        trackTitle,
        artist,
        thumbnail,
        memberId,
        memberName: resolvedMemberName,
        familyId,
      });
    }

    // Contextual Memories: Special Dates
    const isSpecialDate =
      contextTags.includes('data_especial') ||
      contextTags.includes('aniversario') ||
      contextTags.includes('natal') ||
      contextTags.includes('ano_novo');

    if (isSpecialDate) {
      story.specialContexts.push({
        id: `ctx-${now}-special`,
        type: 'data_especial',
        label: 'Data Especial',
        timestamp: now,
        details: 'Tocada em momento comemorativo especial.',
      });

      MemoriesStorage.addTimelineEvent(familyId, {
        id: `tl-${now}-special-date`,
        timestamp: now,
        eventType: 'SPECIAL_DATE_SOUNDTRACK',
        title: `Data Especial: ${trackTitle}`,
        description: `Registrado em uma data comemorativa inesquecível.`,
        icon: '🎉',
        trackId,
        trackTitle,
        artist,
        thumbnail,
        memberId,
        memberName: resolvedMemberName,
        familyId,
      });
    }

    // Season Check (Verão)
    const monthIndex = dateObj.getMonth(); // 0 = Jan, 11 = Dec
    const isSummerMonth = monthIndex === 11 || monthIndex === 0 || monthIndex === 1 || contextTags.includes('verao');
    if (isSummerMonth) {
      MemoriesStorage.addTimelineEvent(familyId, {
        id: `tl-${now}-summer`,
        timestamp: now,
        eventType: 'SUMMER_HIT',
        title: `Música do Verão: ${trackTitle}`,
        description: `Trilha marcante da temporada de verão da família.`,
        icon: '🌴',
        trackId,
        trackTitle,
        artist,
        thumbnail,
        memberId,
        memberName: resolvedMemberName,
        familyId,
      });
    }

    // Day Tracker: First & Last Track of Day
    const dateKey = dateObj.toISOString().slice(0, 10);
    const dayTracker = MemoriesStorage.getDayTracker(dateKey) || {};

    if (!dayTracker.firstTrackId) {
      dayTracker.firstTrackId = trackId;
      MemoriesStorage.addTimelineEvent(familyId, {
        id: `tl-${now}-first-day`,
        timestamp: now,
        eventType: 'FIRST_TRACK_OF_DAY',
        title: `Primeira música do dia: ${trackTitle}`,
        description: `${resolvedMemberName} deu o play inicial do dia!`,
        icon: '🌅',
        trackId,
        trackTitle,
        artist,
        thumbnail,
        memberId,
        memberName: resolvedMemberName,
        familyId,
      });
    }

    dayTracker.lastTrackId = trackId;
    MemoriesStorage.setDayTracker(dateKey, dayTracker);

    // Month Tracker: First Track of Month
    const monthKey = dateObj.toISOString().slice(0, 7); // "YYYY-MM"
    const monthTracker = MemoriesStorage.getMonthTracker(monthKey) || {};

    if (!monthTracker.firstTrackId) {
      monthTracker.firstTrackId = trackId;

      const monthName = dateObj.toLocaleString('pt-BR', { month: 'long' });
      MemoriesStorage.setMonthTracker(monthKey, monthTracker);

      MemoriesStorage.addTimelineEvent(familyId, {
        id: `tl-${now}-first-month`,
        timestamp: now,
        eventType: 'FIRST_TRACK_OF_MONTH',
        title: `Primeira música do mês (${monthName}): ${trackTitle}`,
        description: `Abrindo a trilha sonora do mês com ${artist}.`,
        icon: '📅',
        trackId,
        trackTitle,
        artist,
        thumbnail,
        memberId,
        memberName: resolvedMemberName,
        familyId,
      });
    }

    // Member Favorite Evaluation
    const memberPlays = story.playCountByMember[memberId] || 0;
    const currentFavs = MemoriesStorage.loadMemberFavorites();
    const currentFav = currentFavs[memberId];

    if (!currentFav || memberPlays > currentFav.playCount) {
      const newFav: MemberFavoriteMemory = {
        memberId,
        memberName: resolvedMemberName,
        trackId,
        trackTitle,
        artist,
        thumbnail,
        playCount: memberPlays,
        updatedAt: now,
      };

      MemoriesStorage.saveMemberFavorite(newFav);

      MemoriesStorage.addTimelineEvent(familyId, {
        id: `tl-${now}-fav-${memberId}`,
        timestamp: now,
        eventType: 'MEMBER_FAVORITE',
        title: `Música favorita de ${resolvedMemberName}`,
        description: `"${trackTitle}" é agora a faixa mais ouvida por ${resolvedMemberName} (${memberPlays} reproduções).`,
        icon: '⭐',
        trackId,
        trackTitle,
        artist,
        thumbnail,
        memberId,
        memberName: resolvedMemberName,
        familyId,
      });
    }

    // Save updated story to persistence
    MemoriesStorage.saveTrackStory(story);

    return story;
  }
}

export const musicalMemoriesEngine = MusicalMemoriesEngine.getInstance();
