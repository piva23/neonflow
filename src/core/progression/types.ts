export type XPEventType =
  // Individual Events
  | 'TRACK_STARTED'
  | 'TRACK_FINISHED'
  | 'TRACK_SKIPPED'
  | 'TRACK_LIKED'
  | 'TRACK_ADDED'
  | 'PLAYLIST_CREATED'
  | 'MEMBER_JOINED_SESSION'
  | 'MEMBER_LEFT_SESSION'
  | 'SESSION_FINISHED'
  | 'TRACK_LISTENED_BY_ALL'
  | 'TRACK_DISCOVERED'
  | 'UNANIMOUS_LIKES'
  | 'PERFECT_SESSION_NO_SKIPS'
  | 'LONG_SESSION_COMPLETED'
  | 'TRACK_REGISTERED'
  // Family Events
  | 'EVERYONE_LISTENING_TOGETHER'
  | 'FAMILY_SESSION_COMPLETED'
  | 'FIRST_SESSION_OF_DAY'
  | 'FIRST_SONG_OF_DAY'
  | 'SHARED_PLAYLIST_CREATED'
  | 'DISCOVERY_TRACK_ADDED'
  | 'FAMILY_FIRST_PLAY';

export interface XPEventPayload {
  isController?: boolean; // True if member is session host/controller
  isTrackContributor?: boolean; // True if member added/uploaded the track being played
  isDiscovery?: boolean; // True if track was discovered by this member
  isFamilyFirstPlay?: boolean; // True if first time track played for whole family
  isUnanimousLikes?: boolean; // True if all members in session liked track
  hasNoSkips?: boolean; // True if session completed without any skips
  isLongSession?: boolean; // True if session duration > 30 minutes
  participantCount?: number; // Number of active participants in session
  durationMinutes?: number; // Duration of active session in minutes
  likesCount?: number; // Number of likes in session
  skipsCount?: number; // Number of skips in session
  tracksPlayedCount?: number; // Total tracks played in session
  playlistTrackCount?: number; // Number of tracks in playlist created
  trackId?: string;
  playlistId?: string;
  [key: string]: any;
}

export interface XPEvent {
  id: string;
  type: XPEventType;
  memberId: string;
  familyId?: string;
  sessionId?: string;
  timestamp: number;
  payload?: XPEventPayload;
}

export type RewardType = 'badge' | 'title' | 'theme_unlock' | 'special_perk';

export interface Reward {
  id: string;
  title: string;
  description: string;
  badgeIcon: string;
  type: RewardType;
  unlockedAt?: number;
  rarity?: AchievementRarity;
}

export type AchievementCategory =
  | 'Músicas'
  | 'Playlists'
  | 'Família'
  | 'Sessões'
  | 'Descobertas'
  | 'Tempo ouvido';

export type AchievementRarity =
  | 'Bronze'
  | 'Prata'
  | 'Ouro'
  | 'Platina'
  | 'Lendário';

export interface AchievementProgressState {
  currentValue: number;
  targetValue: number;
  completed: boolean;
  unlockedAt?: number;
  percent: number;
}

export interface AchievementItem {
  id: string;
  nome: string;
  descrição: string;
  categoria: AchievementCategory;
  ícone: string;
  raridade: AchievementRarity;
  xp: number;
  condição: string;
  progresso: AchievementProgressState;
  isSecret?: boolean;
}

export interface AchievementProgress {
  id: string;
  key: string;
  title: string;
  description: string;
  currentValue: number;
  targetValue: number;
  completed: boolean;
  unlockedAt?: number;
  rewardBadge?: string;
  category?: AchievementCategory;
  rarity?: AchievementRarity;
  xpReward?: number;
  isSecret?: boolean;
}

export interface MemberProgressStats {
  tracksPlayed: number;
  tracksFinished: number;
  tracksLiked: number;
  tracksAdded: number;
  playlistsCreated: number;
  sessionsParticipated: number;
  totalMinutesListened: number;
  maxPlaylistSize: number;
  discoveriesCount: number;
  everyoneTogetherCount: number;
  familyFirstPlaysCount?: number;
  unanimousLikesCount?: number;
  noSkipSessionsCount?: number;
  longSessionsCount?: number;
  tracksRegisteredCount?: number;
  secretAchievementsUnlocked?: number;
}

export interface MemberProgress {
  memberId: string;
  level: number;
  xp: number;
  totalXp: number;
  streakDays: number;
  lastActiveDate?: string; // YYYY-MM-DD
  unlockedRewards: Reward[];
  achievements: Record<string, AchievementProgress>;
  detailedAchievements?: Record<string, AchievementItem>;
  stats: MemberProgressStats;
}

export interface SessionProgress {
  sessionId: string;
  totalXpEarned: number;
  tracksPlayedCount: number;
  activeMemberIds: string[];
  durationMinutes: number;
  likesCount: number;
  skipsCount: number;
  startedAt: number;
  endedAt?: number;
}

export interface FamilyProgress {
  familyId: string;
  level: number;
  totalFamilyXp: number;
  activeMembersCount: number;
  familyAchievements: Record<string, AchievementProgress>;
  unlockedPerks: string[];
}

export interface XPCalculationResult {
  individualXp: number;
  familyXp: number;
  sessionXp: number;
  totalXp: number;
  roleMultiplierApplied: number;
  streakMultiplierApplied: number;
  breakdownNotes: string[];
}

export interface ProgressionUpdateResult {
  event: XPEvent;
  memberProgress: MemberProgress;
  familyProgress?: FamilyProgress;
  sessionProgress?: SessionProgress;
  xpCalculation: XPCalculationResult;
  xpGained: number;
  levelUp: boolean;
  newRewards: Reward[];
  newAchievementsUnlocked?: AchievementItem[];
}
