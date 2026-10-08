import { storage } from './storage';
import { Family, Member, Track, Playlist } from '../types';

/**
 * NeonFlow Storage Migration Routine
 * Detects legacy keys from earlier iterations and migrates data atomically to the new single sources of truth.
 * For fresh installations, starts completely empty with zero mock data.
 */
export function runStorageMigration(): void {
  try {
    const PREFIX = 'neonflow_v1_';

    // 1. Migrate Family & Member data to 'family_data'
    const hasNewFamilyData = localStorage.getItem(`${PREFIX}family_data`);
    if (!hasNewFamilyData) {
      const oldFamilies = storage.load<Family[] | null>('families_list', null);
      if (oldFamilies && oldFamilies.length > 0) {
        const oldActiveFamId = storage.load<string>('active_family_id', oldFamilies[0].id);
        const activeFamObj = oldFamilies.find((f) => f.id === oldActiveFamId) || oldFamilies[0];
        
        const legacyMembersKey = `members_${activeFamObj.id}`;
        const legacyMembers = storage.load<Member[] | null>(legacyMembersKey, null);

        const finalMembers = legacyMembers && legacyMembers.length > 0 
          ? legacyMembers 
          : (activeFamObj.members || []);

        const oldActiveMemberId = storage.load<string | null>('active_member_id', null);
        const finalActiveMemberId = (oldActiveMemberId && finalMembers.some((m) => m.id === oldActiveMemberId))
          ? oldActiveMemberId
          : (finalMembers[0]?.id || '');

        const migratedFamilyData = {
          families: oldFamilies.map((f) => f.id === activeFamObj.id ? { ...f, members: finalMembers } : f),
          activeFamilyId: activeFamObj.id,
          activeMemberId: finalActiveMemberId,
        };

        storage.save('family_data', migratedFamilyData);
      } else {
        // Fresh install -> Empty family_data store
        storage.save('family_data', {
          families: [],
          activeFamilyId: '',
          activeMemberId: '',
        });
      }

      // Clean legacy family keys
      storage.remove('families_list');
      storage.remove('active_family_id');
      storage.remove('family_session');
      storage.remove('active_member_id');
    }

    // 2. Clean old tracks / legacy keys if necessary
    const legacyTracksKey = 'musical_musics';
    const legacyTracks = storage.load<Track[] | null>(legacyTracksKey, null);
    if (legacyTracks && Array.isArray(legacyTracks)) {
      const currentTracks = storage.load<Track[]>('global_tracks', []);
      if (!currentTracks || currentTracks.length === 0) {
        storage.save('global_tracks', legacyTracks);
      }
      storage.remove(legacyTracksKey);
    }

    // 3. Clean legacy playlist keys
    const legacyPlaylistKey = 'playlists_data';
    const oldPlaylists = storage.load<Playlist[] | null>(legacyPlaylistKey, null);
    if (oldPlaylists && Array.isArray(oldPlaylists)) {
      const currentV2 = storage.load<Playlist[]>('playlists_data_v2', []);
      if (currentV2.length === 0) {
        storage.save('playlists_data_v2', oldPlaylists);
      }
      storage.remove(legacyPlaylistKey);
    }
  } catch (err) {
    console.error('[StorageMigration] Error during storage migration:', err);
  }
}
