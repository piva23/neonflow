import { Track } from '../types';
import { StorageRepository } from './StorageRepository';
import { PlaylistRepository } from './PlaylistRepository';
import { HistoryRepository } from './HistoryRepository';
import { MusicMetadataService } from '../services/MusicMetadataService';
import { extractYoutubeId, isValidYoutubeUrl, getYoutubeThumbnail } from '../utils/youtube';

const TRACKS_KEY = 'global_tracks';

export interface ValidationResult {
  isValid: boolean;
  errors: {
    title?: string;
    artist?: string;
    youtubeUrl?: string;
    general?: string;
  };
}

export class MusicRepository {
  /**
   * Get all tracks from storage (fallback to empty array [])
   */
  static getAll(): Track[] {
    const raw = StorageRepository.get<Track[]>(TRACKS_KEY, []);
    return MusicMetadataService.normalizeTrackList(raw);
  }

  /**
   * Save all tracks array to storage
   */
  static saveAll(tracks: Track[]): void {
    StorageRepository.set<Track[]>(TRACKS_KEY, tracks);
  }

  /**
   * Find a track by ID
   */
  static getById(id: string): Track | undefined {
    return this.getAll().find((t) => t.id === id);
  }

  /**
   * Validate track fields before creation or edit
   */
  static validateTrackInput(
    title: string,
    artist: string,
    youtubeUrlOrId: string,
    existingId?: string
  ): ValidationResult {
    const errors: ValidationResult['errors'] = {};

    if (!title || !title.trim()) {
      errors.title = 'O título da música é obrigatório.';
    }

    if (!artist || !artist.trim()) {
      errors.artist = 'O nome do artista é obrigatório.';
    }

    const ytId = extractYoutubeId(youtubeUrlOrId);
    if (!ytId || ytId.length !== 11) {
      errors.youtubeUrl = 'Link ou ID do YouTube inválido. Cole uma URL válida do YouTube.';
    }

    // Check duplicate IDs if creating or if ID changes
    if (existingId) {
      const all = this.getAll();
      const duplicateId = all.find((t) => t.id === existingId && t.id !== existingId);
      if (duplicateId) {
        errors.general = 'Uma música com este ID já existe.';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Add a new track to the library
   */
  static addTrack(
    title: string,
    artist: string,
    youtubeUrlOrId: string,
    addedBy: string,
    extraFields?: Partial<Track>
  ): Track {
    const validation = this.validateTrackInput(title, artist, youtubeUrlOrId);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      throw new Error(firstError || 'Dados da música inválidos.');
    }

    const youtubeId = extractYoutubeId(youtubeUrlOrId);
    const tracks = this.getAll();

    // Check for duplicate YouTube ID to prevent duplicate entries
    const existingSameYt = tracks.find((t) => t.youtubeId === youtubeId);
    if (existingSameYt) {
      // Still allow adding if user explicitly wants, but warn in log
      console.warn('[MusicRepository] Warning: YouTube ID already exists in library:', youtubeId);
    }

    const now = new Date().toISOString();
    const newId = `track-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newTrack: Track = {
      id: newId,
      title: title.trim(),
      artist: artist.trim(),
      youtubeId,
      youtubeUrl: youtubeUrlOrId.trim(),
      thumbnail: extraFields?.thumbnail || getYoutubeThumbnail(youtubeId),
      duration: extraFields?.duration || 210,
      genre: extraFields?.genre || 'Pop',
      genres: extraFields?.genres || [extraFields?.genre || 'Pop'],
      moods: extraFields?.moods || ['Alegre'],
      favorite: false,
      playsCount: 0,
      timesPlayed: 0,
      addedBy: addedBy || 'p-1',
      addedAt: now,
      createdAt: now,
      updatedAt: now,
      ...extraFields,
    };

    const updated = [newTrack, ...tracks];
    this.saveAll(updated);
    return newTrack;
  }

  /**
   * Save a fully constructed Track object (e.g. imported local MP3) directly to library
   */
  static addDirectTrack(track: Track): Track {
    const tracks = this.getAll();
    const updated = [track, ...tracks.filter((t) => t.id !== track.id)];
    this.saveAll(updated);
    return track;
  }

  /**
   * Update an existing track's fields and save automatically
   */
  static updateTrack(id: string, updatedFields: Partial<Track>): Track | null {
    const tracks = this.getAll();
    const index = tracks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const currentTrack = tracks[index];

    // If YouTube URL or ID changed, extract new youtubeId
    let youtubeId = currentTrack.youtubeId;
    if (updatedFields.youtubeUrl || updatedFields.youtubeId) {
      const candidate = updatedFields.youtubeUrl || updatedFields.youtubeId || '';
      const extracted = extractYoutubeId(candidate);
      if (extracted && extracted.length === 11) {
        youtubeId = extracted;
      }
    }

    const updatedTrack: Track = {
      ...currentTrack,
      ...updatedFields,
      youtubeId,
      thumbnail: updatedFields.thumbnail || getYoutubeThumbnail(youtubeId),
      updatedAt: new Date().toISOString(),
    };

    // Re-apply Metadata Service Normalization for safety
    const normalized = MusicMetadataService.normalizeTrackList([updatedTrack])[0];

    tracks[index] = normalized;
    this.saveAll(tracks);
    return normalized;
  }

  /**
   * Delete a track from Library and cascade-remove from all Playlists
   */
  static deleteTrack(id: string): boolean {
    const tracks = this.getAll();
    const filtered = tracks.filter((t) => t.id !== id);
    if (filtered.length === tracks.length) return false; // Track not found

    // Save updated library
    this.saveAll(filtered);

    // Cascade remove from all custom playlists
    PlaylistRepository.removeTrackFromAllPlaylists(id);

    // Cascade remove from History
    HistoryRepository.removeByTrackId(id);

    return true;
  }

  /**
   * Duplicate an existing track with a new ID and suffix "(Cópia)"
   */
  static duplicateTrack(id: string): Track | null {
    const track = this.getById(id);
    if (!track) return null;

    const now = new Date().toISOString();
    const copyId = `track-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const copyTrack: Track = {
      ...track,
      id: copyId,
      title: `${track.title} (Cópia)`,
      favorite: false,
      playsCount: 0,
      timesPlayed: 0,
      createdAt: now,
      updatedAt: now,
    };

    const tracks = this.getAll();
    this.saveAll([copyTrack, ...tracks]);
    return copyTrack;
  }

  /**
   * Toggle favorite state for a track
   */
  static toggleFavorite(id: string): boolean {
    const track = this.getById(id);
    if (!track) return false;

    const newFav = !track.favorite;
    this.updateTrack(id, { favorite: newFav });
    return newFav;
  }

  /**
   * Update rating for a track (0 to 5)
   */
  static updateRating(id: string, rating: number): void {
    this.updateTrack(id, { rating });
  }

  /**
   * Search tracks by title, artist, genre, or tags
   */
  static searchTracks(query: string): Track[] {
    if (!query || !query.trim()) return this.getAll();
    const q = query.toLowerCase().trim();
    return this.getAll().filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.genre && t.genre.toLowerCase().includes(q)) ||
        (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
    );
  }

  /**
   * Get favorite tracks
   */
  static getFavorites(): Track[] {
    return this.getAll().filter((t) => Boolean(t.favorite));
  }
}
