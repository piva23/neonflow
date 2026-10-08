export type TimelineEventType =
  | 'FIRST_TRACK_OF_DAY'
  | 'LAST_TRACK_OF_DAY'
  | 'FIRST_TRACK_OF_MONTH'
  | 'SUMMER_HIT'
  | 'ROADTRIP_HIT'
  | 'MEMBER_FAVORITE'
  | 'FAMILY_FIRST_PLAY'
  | 'FIRST_SESSION_PLAY'
  | 'SUNDAY_SOUNDTRACK'
  | 'SPECIAL_DATE_SOUNDTRACK';

export interface TrackStoryContext {
  id: string;
  type: 'viagem' | 'domingo' | 'data_especial' | 'primeira_sessao' | 'primeira_vez_familia' | 'estacao';
  label: string;
  timestamp: number;
  details?: string;
}

export interface TrackStoryMilestone {
  id: string;
  timestamp: number;
  title: string;
  description: string;
  icon: string;
  memberId?: string;
  memberName?: string;
}

export interface TrackStoryMemberRef {
  memberId: string;
  memberName: string;
}

export interface TrackStory {
  trackId: string;
  trackTitle: string;
  artist: string;
  album?: string;
  thumbnail?: string;
  duration?: number;
  
  // Timestamps
  firstHeardAt: number;
  lastHeardAt: number;
  
  // History & Stats
  presentedBy: {
    memberId: string;
    memberName: string;
    timestamp: number;
  };
  playCount: number;
  totalDurationSeconds: number;
  
  // Member breakdowns
  playCountByMember: Record<string, number>;
  durationByMember: Record<string, number>;
  
  topListener: {
    memberId: string;
    memberName: string;
    playCount: number;
  } | null;
  
  neverListenedMembers: TrackStoryMemberRef[];
  
  // Contextual memories
  firstTimeFamilyAt?: number;
  firstSessionId?: string;
  
  specialContexts: TrackStoryContext[];
  milestones: TrackStoryMilestone[];
}

export interface TimelineEvent {
  id: string;
  timestamp: number;
  eventType: TimelineEventType;
  title: string;
  description: string;
  icon: string;
  trackId: string;
  trackTitle: string;
  artist: string;
  thumbnail?: string;
  memberId?: string;
  memberName?: string;
  familyId?: string;
  context?: Record<string, any>;
}

export interface TimelineFilter {
  familyId?: string;
  memberId?: string;
  eventType?: TimelineEventType;
  startDate?: number;
  endDate?: number;
  monthKey?: string; // e.g., "2026-07"
}

export interface MemberFavoriteMemory {
  memberId: string;
  memberName: string;
  trackId: string;
  trackTitle: string;
  artist: string;
  thumbnail?: string;
  playCount: number;
  updatedAt: number;
}

export interface MemoriesSummary {
  totalTrackStories: number;
  totalTimelineEvents: number;
  topFamilyTrack?: TrackStory;
  memberFavorites: Record<string, MemberFavoriteMemory>;
  recentMilestones: TimelineEvent[];
}
