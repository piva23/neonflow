import { Playlist } from '../types';
import { StorageRepository } from './StorageRepository';
import { PlaylistService, CreatePlaylistInput, UpdatePlaylistInput } from '../services/playlistService';

const STORAGE_KEY = 'playlists_data_v2';
const LEGACY_KEY = 'playlists_data';

export class PlaylistRepository {
  static getAll(): Playlist[] {
    const playlists = PlaylistService.loadCustomPlaylists();
    return playlists;
  }

  static saveAll(playlists: Playlist[]): void {
    PlaylistService.saveCustomPlaylists(playlists);
  }

  static getById(id: string): Playlist | undefined {
    return this.getAll().find((p) => p.id === id);
  }

  static create(input: CreatePlaylistInput): Playlist {
    const playlists = this.getAll();
    const newPlaylist = PlaylistService.create(input);
    const updated = [newPlaylist, ...playlists];
    this.saveAll(updated);
    return newPlaylist;
  }

  static update(id: string, input: UpdatePlaylistInput): Playlist | null {
    const playlists = this.getAll();
    const index = playlists.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const updatedPlaylist: Playlist = {
      ...playlists[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };

    playlists[index] = updatedPlaylist;
    this.saveAll(playlists);
    return updatedPlaylist;
  }

  static delete(id: string): boolean {
    const playlists = this.getAll();
    const filtered = playlists.filter((p) => p.id !== id);
    if (filtered.length === playlists.length) return false;
    this.saveAll(filtered);
    return true;
  }

  static duplicate(playlist: Playlist, newOwner?: string): Playlist {
    const playlists = this.getAll();
    const copy = PlaylistService.duplicate(playlist, newOwner);
    this.saveAll([copy, ...playlists]);
    return copy;
  }

  /**
   * Remove a track ID from all custom playlists (called when deleting a song)
   */
  static removeTrackFromAllPlaylists(trackId: string): void {
    const playlists = this.getAll();
    let modified = false;

    const updated = playlists.map((pl) => {
      const hasInSongs = pl.songs && pl.songs.includes(trackId);
      const hasInTracks = pl.tracks && pl.tracks.some((t) => t.id === trackId);

      if (hasInSongs || hasInTracks) {
        modified = true;
        return {
          ...pl,
          songs: (pl.songs || []).filter((id) => id !== trackId),
          tracks: (pl.tracks || []).filter((t) => t.id !== trackId),
          updatedAt: new Date().toISOString(),
        };
      }
      return pl;
    });

    if (modified) {
      this.saveAll(updated);
    }
  }

  static addTrackToPlaylist(playlistId: string, trackId: string): boolean {
    const playlist = this.getById(playlistId);
    if (!playlist) return false;

    const currentSongs = playlist.songs || [];
    if (currentSongs.includes(trackId)) return true; // Already exists

    this.update(playlistId, {
      songs: [...currentSongs, trackId],
    });
    return true;
  }

  static removeTrackFromPlaylist(playlistId: string, trackId: string): boolean {
    const playlist = this.getById(playlistId);
    if (!playlist) return false;

    const currentSongs = playlist.songs || [];
    const currentTracks = playlist.tracks || [];

    this.update(playlistId, {
      songs: currentSongs.filter((id) => id !== trackId),
      tracks: currentTracks.filter((t) => t.id !== trackId),
    });
    return true;
  }
}
