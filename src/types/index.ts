/**
 * Core type definitions for NeonFlow application
 */

export type MemberRole = 'Pai' | 'Mãe' | 'Filho' | 'Filha' | 'Outro';

export interface MemberStatistics {
  listenTime: number; // in minutes
  totalFavorites: number;
  playlistsCreated: number;
  tracksAdded: number;
}

export interface Member {
  id: string;
  name: string;
  role: MemberRole;
  avatar: string; // Emoji, preset ID, or image URL
  color: string;  // Hex color code
  birthday?: string; // YYYY-MM-DD
  favoriteGenres?: string[];
  favoriteArtists?: string[];
  favoritePlaylists?: string[];
  favoriteSongs?: string[];
  level: number;
  xp: number;
  streak?: number;
  listenTime?: number;
  badges?: string[];
  statistics: MemberStatistics;
  createdAt: string;
}

// Alias for backwards compatibility with Profile
export type Profile = Member;

export type TrackSourceType = 'youtube' | 'local';

export interface TrackSource {
  type: TrackSourceType;
  youtubeId?: string;
  youtubeUrl?: string;
  localPath?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  youtubeId: string; // Youtube video ID extracted from link
  youtubeUrl?: string; // Full YouTube URL
  source?: TrackSource; // Dual source architecture preparation (youtube | local)
  album?: string;
  thumbnail?: string;
  duration: number; // in seconds
  genre?: string; // Primary genre (backwards compatibility)
  genres?: string[]; // Multi-genre support
  moods?: string[];
  languages?: string[];
  decades?: string[];
  instruments?: string[];
  energyLevel?: number; // 0 to 100
  relaxLevel?: number; // 0 to 100
  danceLevel?: number; // 0 to 100
  focusLevel?: number; // 0 to 100
  emotion?: string;
  weather?: string;
  season?: string;
  occasion?: string | string[];
  tags?: string[];
  favorite?: boolean;
  rating?: number; // 0 to 5
  timesPlayed?: number; // Plays count
  lastPlayed?: string; // ISO date string of last play
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
  notes?: string;
  playlists?: string[]; // Playlist IDs
  addedBy: string; // Member ID
  addedAt: string; // ISO date string
  playsCount: number;
}

export type PlaylistType = 'personal' | 'family' | 'mood' | 'automatic' | 'smart';
export type PlaylistVisibility = 'private' | 'family' | 'public';
export type PlaylistCoverType = 'gradient' | 'solid' | 'image' | 'mosaic';

export interface Playlist {
  id: string;
  name: string;
  description: string;
  cover?: string;
  coverType?: PlaylistCoverType;
  coverColor: string;
  color?: string;
  icon?: string;
  createdAt?: string;
  updatedAt?: string;
  favorite?: boolean;
  pinned?: boolean;
  visibility?: PlaylistVisibility;
  songs?: string[];
  tracks: Track[];
  tags?: string[];
  mood?: string;
  type?: PlaylistType;
  owner?: string; // Member ID, 'family', or 'system'
  lastPlayed?: string;
  timesPlayed?: number;
  isFamilyShared?: boolean;
  createdBy?: string;
}

export interface FamilySettings {
  autoSync: boolean;
  defaultGenre: string;
  allowExplicitContent: boolean;
  themeColor: string;
  maxMembersLimit: number;
}

export interface FamilyStatistics {
  totalListenTime: number; // in minutes
  totalTracks: number;
  totalPlaylists: number;
  totalMembers: number;
  topGenre: string;
  topMood: string;
  xp: number;
  achievementsCount: number;
}

export interface Family {
  id: string;
  name: string;
  familyName?: string; // Backwards compatibility
  photo: string; // Emoji, banner image URL, or avatar
  color: string; // Theme hex code
  description: string;
  inviteCode: string;
  createdAt: string;
  members: Member[];
  settings: FamilySettings;
  favoriteGenres: string[];
  favoriteMoods: string[];
  statistics: FamilyStatistics;
}

export interface PlaybackState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  queue: Track[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'gamification';
  timestamp: string;
}

// ==========================================
// MUSICAL SESSIONS MODEL DEFINITIONS
// ==========================================

export type SessionType = 'livre' | 'planejada';
export type SessionStatus = 'active' | 'paused' | 'completed';
export type ParticipantStatus = 'participando' | 'ausente' | 'convidado';

export interface SessionParticipant {
  memberId: string;
  status: ParticipantStatus;
  name?: string;
  avatar?: string;
}

export interface SessionSong {
  id: string;
  trackId: string;
  title: string;
  artist: string;
  thumbnail?: string;
  startedAt: string; // ISO String
  endedAt?: string;  // ISO String
  listenedTime: number; // in seconds
  skipped: boolean;
  favorited: boolean;
}

export type SessionTimelineEventType =
  | 'start'
  | 'song_start'
  | 'song_end'
  | 'pause'
  | 'resume'
  | 'participant_add'
  | 'participant_remove'
  | 'moment_add'
  | 'finish';

export interface SessionTimelineEvent {
  id: string;
  type: SessionTimelineEventType;
  timestamp: string; // ISO String
  title: string;
  description?: string;
  metadata?: {
    songTitle?: string;
    artist?: string;
    memberName?: string;
    memberAvatar?: string;
    listenedTime?: number;
    momentText?: string;
  };
}

export interface SessionStatistics {
  totalSongs: number;
  listenTime: number; // total time listened in seconds
  topSong?: string;
  topArtist?: string;
  playlistName?: string;
  participantsCount: number;
}

export interface Session {
  id: string;
  name: string;
  description?: string;
  type: SessionType;
  status: SessionStatus;
  createdAt: string; // ISO String
  startedAt: string;   // ISO String
  scheduledAt?: string; // Scheduled Date
  finishedAt?: string;  // ISO String
  duration: number; // in seconds
  playlistId?: string;
  playlistName?: string;
  controllerId?: string; // Controller member ID
  controllerName?: string; // Controller member Name
  notes?: string; // Observações da sessão
  participants: string[]; // Member IDs
  participantDetails?: SessionParticipant[]; // Member detailed participation status
  songs: SessionSong[];
  timeline: SessionTimelineEvent[];
  favoriteMoments?: string[];
  mood?: string;
  objective?: string;
  cover?: string;
  color?: string;
  statistics: SessionStatistics;
}

// ==========================================
// GAMIFICATION / XP MODEL PREPARATION
// ==========================================

export type XPActionType =
  | 'play_track'
  | 'add_track'
  | 'create_playlist'
  | 'complete_session'
  | 'daily_streak'
  | 'favorite_song'
  | 'family_collaboration';

export interface XPLog {
  id: string;
  memberId: string;
  familyId?: string;
  amount: number;
  action: XPActionType;
  description: string;
  timestamp: string;
}

export interface LevelThreshold {
  level: number;
  title: string;
  xpRequired: number;
  badgeIcon: string;
}

export interface MemberXPData {
  memberId: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  streakDays: number;
  badges: string[];
  history: XPLog[];
}
