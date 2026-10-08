import {
  XPEvent,
  MemberProgress,
  FamilyProgress,
  SessionProgress,
  ProgressionUpdateResult,
  Reward,
  AchievementItem,
} from './types';
import { ProgressionStorage } from './ProgressionStorage';
import { XPManager } from './XPManager';
import { LevelManager } from './LevelManager';
import { RewardManager } from './RewardManager';
import { AchievementEngine } from './AchievementEngine';

type ProgressionListener = (result: ProgressionUpdateResult) => void;

export class EventProcessor {
  private listeners: Set<ProgressionListener> = new Set();

  /**
   * Subscribe to progression update events
   */
  subscribe(listener: ProgressionListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Process incoming XP event and perform atomic state transitions
   */
  processEvent(event: XPEvent): ProgressionUpdateResult {
    // 1. Load or initialize Member Progress
    let memberProgress = ProgressionStorage.loadMemberProgress(event.memberId);
    if (!memberProgress) {
      memberProgress = {
        memberId: event.memberId,
        level: 1,
        xp: 0,
        totalXp: 0,
        streakDays: 1,
        unlockedRewards: [],
        achievements: RewardManager.getDefaultAchievements(),
        stats: {
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
        },
      };
    }

    // 2. Daily Streak Check
    const todayStr = new Date().toISOString().slice(0, 10);
    if (memberProgress.lastActiveDate) {
      if (memberProgress.lastActiveDate !== todayStr) {
        const lastDate = new Date(memberProgress.lastActiveDate);
        const todayDate = new Date(todayStr);
        const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          memberProgress.streakDays += 1;
        } else if (diffDays > 1) {
          memberProgress.streakDays = 1; // Reset streak if missed a day
        }
        memberProgress.lastActiveDate = todayStr;
      }
    } else {
      memberProgress.lastActiveDate = todayStr;
    }

    // 3. Calculate 3-tier XP from event
    const xpCalculation = XPManager.calculate(event, memberProgress);
    const oldLevel = memberProgress.level;

    memberProgress.totalXp += xpCalculation.totalXp;

    // 4. Evaluate Achievements via AchievementEngine
    const achEvaluation = AchievementEngine.getInstance().evaluate(
      memberProgress,
      event
    );
    memberProgress = achEvaluation.updatedMemberProgress;

    // Add bonus XP awarded by newly unlocked achievements
    if (achEvaluation.bonusXpAwarded > 0) {
      memberProgress.totalXp += achEvaluation.bonusXpAwarded;
    }

    // 5. Recalculate Level
    const levelInfo = LevelManager.calculateLevel(memberProgress.totalXp);
    memberProgress.level = levelInfo.level;
    memberProgress.xp = levelInfo.currentLevelXp;

    const levelUp = memberProgress.level > oldLevel;

    // 6. Collect Level Rewards and Achievement Badges
    const newRewards: Reward[] = [];
    if (levelUp) {
      const lvlRewards = LevelManager.getRewardsForLevel(memberProgress.level);
      lvlRewards.forEach((r) => {
        memberProgress!.unlockedRewards.push(r);
        newRewards.push(r);
      });
    }

    // Add achievement badge rewards
    achEvaluation.newRewards.forEach((r) => newRewards.push(r));

    // 7. Save Member Progress automatically
    ProgressionStorage.saveMemberProgress(memberProgress);
    ProgressionStorage.logXPEvent(
      event,
      xpCalculation.totalXp + achEvaluation.bonusXpAwarded
    );

    // 9. Process Family Progress if familyId provided
    let familyProgress: FamilyProgress | undefined = undefined;
    if (event.familyId) {
      let famProg = ProgressionStorage.loadFamilyProgress(event.familyId);
      if (!famProg) {
        famProg = {
          familyId: event.familyId,
          level: 1,
          totalFamilyXp: 0,
          activeMembersCount: 1,
          familyAchievements: {},
          unlockedPerks: [],
        };
      }
      famProg.totalFamilyXp += xpCalculation.familyXp + xpCalculation.individualXp;
      const famLevelInfo = LevelManager.calculateLevel(famProg.totalFamilyXp);
      famProg.level = famLevelInfo.level;
      ProgressionStorage.saveFamilyProgress(famProg);
      familyProgress = famProg;
    }

    // 10. Process Session Progress if sessionId provided
    let sessionProgress: SessionProgress | undefined = undefined;
    if (event.sessionId) {
      let sessProg = ProgressionStorage.loadSessionProgress(event.sessionId);
      if (!sessProg) {
        sessProg = {
          sessionId: event.sessionId,
          totalXpEarned: 0,
          tracksPlayedCount: 0,
          activeMemberIds: [event.memberId],
          durationMinutes: 0,
          likesCount: 0,
          skipsCount: 0,
          startedAt: Date.now(),
        };
      }
      sessProg.totalXpEarned += xpCalculation.sessionXp;

      if (event.type === 'TRACK_STARTED' || event.type === 'TRACK_FINISHED') {
        sessProg.tracksPlayedCount += 1;
      }
      if (event.type === 'TRACK_LIKED') {
        sessProg.likesCount += 1;
      }
      if (event.type === 'TRACK_SKIPPED') {
        sessProg.skipsCount += 1;
      }
      if (event.payload?.durationMinutes) {
        sessProg.durationMinutes = Math.max(sessProg.durationMinutes, event.payload.durationMinutes);
      }

      if (!sessProg.activeMemberIds.includes(event.memberId)) {
        sessProg.activeMemberIds.push(event.memberId);
      }

      if (event.type === 'SESSION_FINISHED' || event.type === 'FAMILY_SESSION_COMPLETED') {
        sessProg.endedAt = Date.now();
      }

      ProgressionStorage.saveSessionProgress(sessProg);
      sessionProgress = sessProg;
    }

    const result: ProgressionUpdateResult = {
      event,
      memberProgress,
      familyProgress,
      sessionProgress,
      xpCalculation,
      xpGained: xpCalculation.totalXp + achEvaluation.bonusXpAwarded,
      levelUp,
      newRewards,
      newAchievementsUnlocked: achEvaluation.unlockedAchievements,
    };

    // 11. Notify Subscribers
    this.listeners.forEach((listener) => {
      try {
        listener(result);
      } catch (e) {
        // Prevent listener crashes from affecting event engine
      }
    });

    return result;
  }
}
