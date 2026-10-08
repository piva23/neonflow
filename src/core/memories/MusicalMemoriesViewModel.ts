import {
  TrackStory,
  TimelineEvent,
  TimelineFilter,
  MemberFavoriteMemory,
  MemoriesSummary,
} from './types';
import { MemoriesStorage } from './MemoriesStorage';
import { musicalMemoriesEngine } from './MusicalMemoriesEngine';

export class MusicalMemoriesViewModel {
  /**
   * Get the full story for a specific track
   */
  static getTrackStory(trackId: string): TrackStory | null {
    musicalMemoriesEngine.init();
    return MemoriesStorage.loadTrackStory(trackId);
  }

  /**
   * Get all recorded track stories
   */
  static getAllTrackStories(): TrackStory[] {
    musicalMemoriesEngine.init();
    const stories = MemoriesStorage.loadAllTrackStories();
    return stories.sort((a, b) => b.lastHeardAt - a.lastHeardAt);
  }

  /**
   * Get timeline events for a family with optional filtering
   */
  static getTimelineEvents(filter?: TimelineFilter): TimelineEvent[] {
    musicalMemoriesEngine.init();
    const familyId = filter?.familyId || 'f-1';
    let events = MemoriesStorage.loadTimelineEvents(familyId);

    if (!filter) return events;

    return events.filter((e) => {
      if (filter.memberId && e.memberId !== filter.memberId) return false;
      if (filter.eventType && e.eventType !== filter.eventType) return false;
      if (filter.startDate && e.timestamp < filter.startDate) return false;
      if (filter.endDate && e.timestamp > filter.endDate) return false;
      if (filter.monthKey) {
        const dateStr = new Date(e.timestamp).toISOString().slice(0, 7);
        if (dateStr !== filter.monthKey) return false;
      }
      return true;
    });
  }

  /**
   * Get recorded favorite track for each family member
   */
  static getMemberFavorites(): Record<string, MemberFavoriteMemory> {
    musicalMemoriesEngine.init();
    return MemoriesStorage.loadMemberFavorites();
  }

  /**
   * Get complete memories summary overview for future UI screens
   */
  static getSummary(familyId: string = 'f-1'): MemoriesSummary {
    musicalMemoriesEngine.init();
    const stories = MemoriesStorage.loadAllTrackStories();
    const timeline = MemoriesStorage.loadTimelineEvents(familyId);
    const memberFavorites = MemoriesStorage.loadMemberFavorites();

    const sortedByPlays = [...stories].sort((a, b) => b.playCount - a.playCount);

    return {
      totalTrackStories: stories.length,
      totalTimelineEvents: timeline.length,
      topFamilyTrack: sortedByPlays[0] || undefined,
      memberFavorites,
      recentMilestones: timeline.slice(0, 10),
    };
  }
}
