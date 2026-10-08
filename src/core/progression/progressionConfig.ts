export interface IndividualXPConfig {
  trackFinished: number;
  trackLiked: number;
  trackAdded: number;
  playlistCreated: number;
  memberJoinedSession: number;
  sessionFinished: number;
  trackListenedByAllBonus: number;
  discoveryBonus: number;
  unanimousLikesBonus: number;
  noSkipsSessionBonus: number;
  longSessionBonus: number;
}

export interface FamilyXPConfig {
  everyoneListeningTogether: number;
  familySessionCompleted: number;
  firstSessionOfDay: number;
  firstSongOfDay: number;
  sharedPlaylistCreated: number;
  discoveryTrackAdded: number;
  familyFirstPlay: number;
}

export interface SessionXPConfig {
  basePerTrackPlayed: number;
  participantMultiplierPerMember: number; // +30% per additional member
  everyoneTogetherMultiplier: number; // Boost when all family members listen in sync
  xpPerDurationMinute: number;
  xpPerTrackCompletedInSession: number;
  likeBonusInSession: number;
  skipPenaltyInSession: number;
  controllerRoleMultiplier: number; // Controller receives 0.85x base XP
  participantRoleMultiplier: number; // Participants receive 1.15x base XP
  trackContributorBonus: number; // Member who discovered/registered track receives bonus
}

export interface StreakBonusConfig {
  dailyStreakMultiplierStep: number;
  maxStreakMultiplierBonus: number;
}

export interface ProgressionConfig {
  individual: IndividualXPConfig;
  family: FamilyXPConfig;
  session: SessionXPConfig;
  streak: StreakBonusConfig;
}

export const DEFAULT_PROGRESSION_CONFIG: ProgressionConfig = {
  individual: {
    trackFinished: 8,
    trackLiked: 4,
    trackAdded: 12,
    playlistCreated: 20,
    memberJoinedSession: 8,
    sessionFinished: 25,
    trackListenedByAllBonus: 15,
    discoveryBonus: 15,
    unanimousLikesBonus: 20,
    noSkipsSessionBonus: 25,
    longSessionBonus: 30,
  },
  family: {
    everyoneListeningTogether: 60,
    familySessionCompleted: 80,
    firstSessionOfDay: 25,
    firstSongOfDay: 10,
    sharedPlaylistCreated: 35,
    discoveryTrackAdded: 25,
    familyFirstPlay: 35,
  },
  session: {
    basePerTrackPlayed: 6,
    participantMultiplierPerMember: 0.35,
    everyoneTogetherMultiplier: 2.2,
    xpPerDurationMinute: 1.2,
    xpPerTrackCompletedInSession: 4,
    likeBonusInSession: 3,
    skipPenaltyInSession: -2,
    controllerRoleMultiplier: 0.85,
    participantRoleMultiplier: 1.15,
    trackContributorBonus: 15,
  },
  streak: {
    dailyStreakMultiplierStep: 0.05,
    maxStreakMultiplierBonus: 0.5,
  },
};

let currentConfig: ProgressionConfig = JSON.parse(
  JSON.stringify(DEFAULT_PROGRESSION_CONFIG)
);

export function getProgressionConfig(): ProgressionConfig {
  return currentConfig;
}

export function setProgressionConfig(
  newConfig: Partial<ProgressionConfig>
): ProgressionConfig {
  currentConfig = {
    ...currentConfig,
    ...newConfig,
    individual: { ...currentConfig.individual, ...newConfig.individual },
    family: { ...currentConfig.family, ...newConfig.family },
    session: { ...currentConfig.session, ...newConfig.session },
    streak: { ...currentConfig.streak, ...newConfig.streak },
  };
  return currentConfig;
}

export function resetProgressionConfig(): ProgressionConfig {
  currentConfig = JSON.parse(JSON.stringify(DEFAULT_PROGRESSION_CONFIG));
  return currentConfig;
}
