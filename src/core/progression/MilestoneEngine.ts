import { AchievementProgressState } from './types';

export interface MilestoneDefinition {
  id: string;
  metricKey: string;
  targetValue: number;
}

export class MilestoneEngine {
  /**
   * Calculates current milestone progress object with percentage
   */
  static calculateProgress(
    currentValue: number,
    targetValue: number,
    wasCompletedBefore: boolean = false,
    unlockedAt?: number
  ): AchievementProgressState {
    const safeCurrent = Math.max(0, currentValue);
    const completed = wasCompletedBefore || safeCurrent >= targetValue;
    const percent = Math.min(
      100,
      Math.max(0, Math.floor((safeCurrent / targetValue) * 100))
    );

    return {
      currentValue: safeCurrent,
      targetValue,
      completed,
      unlockedAt: completed ? unlockedAt || Date.now() : undefined,
      percent,
    };
  }

  /**
   * Evaluates if milestone threshold is freshly completed
   */
  static isFreshlyCompleted(
    currentValue: number,
    targetValue: number,
    wasCompletedBefore: boolean
  ): boolean {
    return !wasCompletedBefore && currentValue >= targetValue;
  }
}
