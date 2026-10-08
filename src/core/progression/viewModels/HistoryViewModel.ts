import { XPLogEntry, ProgressionStorage } from '../ProgressionStorage';

export interface HistoryViewData {
  memberId: string;
  logs: XPLogEntry[];
  totalXpLogged: number;
}

export class HistoryViewModel {
  /**
   * Returns XP log history for a member
   */
  static getHistoryData(memberId: string, limit: number = 50): HistoryViewData {
    const logs = ProgressionStorage.getLogs(memberId) || [];
    const recentLogs = logs.slice(0, limit);
    const totalXpLogged = logs.reduce((acc, log) => acc + (log.xpGained || 0), 0);

    return {
      memberId,
      logs: recentLogs,
      totalXpLogged,
    };
  }
}
