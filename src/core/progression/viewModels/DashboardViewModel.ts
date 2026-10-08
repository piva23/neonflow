import { FamilyProgress } from '../types';
import { ProgressionStorage } from '../ProgressionStorage';
import { LevelManager } from '../LevelManager';

export interface DashboardViewData {
  familyId: string;
  familyLevel: number;
  familyLevelTitle: string;
  familyTotalXp: number;
  familyCurrentXp: number;
  familyNextLevelXp: number;
  familyProgressPercent: number;
  activeMembersCount: number;
  topContributorId?: string;
  familyPerks: string[];
}

export class DashboardViewModel {
  /**
   * Returns overview dashboard metrics for family gamification
   */
  static getDashboardData(familyId: string, memberIds: string[] = []): DashboardViewData {
    let famProg = ProgressionStorage.loadFamilyProgress(familyId);
    if (!famProg) {
      famProg = {
        familyId,
        level: 1,
        totalFamilyXp: 0,
        activeMembersCount: memberIds.length || 1,
        familyAchievements: {},
        unlockedPerks: ['Tema Familiar Padrão', 'Sintonizador de Áudio'],
      };
    }

    const levelInfo = LevelManager.calculateLevel(famProg.totalFamilyXp);

    // Find top contributor among members
    let topContributorId: string | undefined = undefined;
    let maxMemberXp = -1;

    memberIds.forEach((mId) => {
      const mProg = ProgressionStorage.loadMemberProgress(mId);
      if (mProg && mProg.totalXp > maxMemberXp) {
        maxMemberXp = mProg.totalXp;
        topContributorId = mId;
      }
    });

    return {
      familyId,
      familyLevel: levelInfo.level,
      familyLevelTitle: levelInfo.title,
      familyTotalXp: famProg.totalFamilyXp,
      familyCurrentXp: levelInfo.currentLevelXp,
      familyNextLevelXp: levelInfo.nextLevelXp,
      familyProgressPercent: levelInfo.progressPercent,
      activeMembersCount: Math.max(famProg.activeMembersCount, memberIds.length),
      topContributorId,
      familyPerks: famProg.unlockedPerks || [],
    };
  }
}
