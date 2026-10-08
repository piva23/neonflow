import { Playlist, PlaylistType, PlaylistVisibility, PlaylistCoverType } from '../types';
import { storage } from './storage';

const STORAGE_KEY = 'playlists_data_v2';
const LEGACY_KEY = 'playlists_data';

export interface CreatePlaylistInput {
  name: string;
  description?: string;
  cover?: string;
  coverType?: PlaylistCoverType;
  coverColor?: string;
  color?: string;
  icon?: string;
  tags?: string[];
  mood?: string;
  type?: PlaylistType;
  visibility?: PlaylistVisibility;
  owner?: string;
  isFamilyShared?: boolean;
  createdBy?: string;
}

export interface UpdatePlaylistInput extends Partial<CreatePlaylistInput> {
  favorite?: boolean;
  pinned?: boolean;
  songs?: string[];
  tracks?: any[];
  lastPlayed?: string;
  timesPlayed?: number;
}

export class PlaylistService {
  /**
   * Load stored custom playlists from LocalStorage, with backward compatibility migration
   */
  static loadCustomPlaylists(): Playlist[] {
    const v2Data = storage.load<Playlist[]>(STORAGE_KEY, []);
    if (v2Data && v2Data.length > 0) {
      return v2Data;
    }

    // Try legacy key
    const legacy = storage.load<Playlist[]>(LEGACY_KEY, []);
    if (legacy && legacy.length > 0) {
      const migrated: Playlist[] = legacy.map((p) => {
        const now = new Date().toISOString();
        return {
          ...p,
          cover: p.coverColor || 'from-indigo-600 to-purple-600',
          coverType: (p.coverType as PlaylistCoverType) || 'gradient',
          coverColor: p.coverColor || 'from-indigo-600 to-purple-600',
          color: '#7b2cbf',
          icon: '🎵',
          createdAt: now,
          updatedAt: now,
          favorite: false,
          pinned: false,
          visibility: p.isFamilyShared ? 'family' : 'private',
          songs: (p.tracks || []).map((t) => t.id),
          tags: ['Família'],
          type: p.isFamilyShared ? 'family' : 'personal',
          owner: p.createdBy || 'p-1',
          isFamilyShared: p.isFamilyShared ?? true,
          createdBy: p.createdBy || 'p-1',
        };
      });
      storage.save(STORAGE_KEY, migrated);
      return migrated;
    }

    return [];
  }

  /**
   * Save playlists array to LocalStorage
   */
  static saveCustomPlaylists(playlists: Playlist[]): void {
    storage.save(STORAGE_KEY, playlists);
  }

  /**
   * Create a new custom playlist
   */
  static create(input: CreatePlaylistInput): Playlist {
    const now = new Date().toISOString();
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}`,
      name: input.name,
      description: input.description || '',
      cover: input.cover || input.coverColor || 'from-indigo-600 to-purple-600',
      coverType: input.coverType || 'gradient',
      coverColor: input.coverColor || input.cover || 'from-indigo-600 to-purple-600',
      color: input.color || '#7b2cbf',
      icon: input.icon || '🎵',
      createdAt: now,
      updatedAt: now,
      favorite: false,
      pinned: false,
      visibility: input.visibility || (input.isFamilyShared ? 'family' : 'private'),
      songs: [],
      tracks: [],
      tags: input.tags || [],
      mood: input.mood || '',
      type: input.type || (input.isFamilyShared ? 'family' : 'personal'),
      owner: input.owner || input.createdBy || 'p-1',
      timesPlayed: 0,
      isFamilyShared: input.isFamilyShared ?? true,
      createdBy: input.createdBy || input.owner || 'p-1',
    };

    return newPlaylist;
  }

  /**
   * Duplicate an existing playlist
   */
  static duplicate(original: Playlist, newOwner?: string): Playlist {
    const now = new Date().toISOString();
    return {
      ...original,
      id: `pl-${Date.now()}`,
      name: `${original.name} (Cópia)`,
      createdAt: now,
      updatedAt: now,
      favorite: false,
      pinned: false,
      owner: newOwner || original.owner || 'p-1',
      createdBy: newOwner || original.createdBy || 'p-1',
      timesPlayed: 0,
    };
  }
}
