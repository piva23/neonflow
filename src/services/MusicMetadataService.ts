import { Track } from '../types';
import { storage } from './storage';
import { sanitizeYouTubeTitle } from '../utils/youtube';

export interface CreateTrackInput {
  title: string;
  artist: string;
  youtubeUrlOrId: string;
  addedBy: string;
  album?: string;
  thumbnail?: string;
  duration?: number;
  genres?: string[];
  moods?: string[];
  languages?: string[];
  decades?: string[];
  instruments?: string[];
  energyLevel?: number;
  relaxLevel?: number;
  danceLevel?: number;
  focusLevel?: number;
  emotion?: string;
  weather?: string;
  season?: string;
  occasion?: string | string[];
  tags?: string[];
  notes?: string;
  rating?: number;
  favorite?: boolean;
}

export class MusicMetadataService {
  /**
   * Auto-infers default energy/relax/dance/focus level metrics based on selected genres/moods
   */
  static getDefaultMetricsForGenre(genres: string[], moods: string[]) {
    let energy = 50;
    let relax = 50;
    let dance = 50;
    let focus = 50;

    const gLower = genres.map((g) => g.toLowerCase());
    const mLower = moods.map((m) => m.toLowerCase());

    if (gLower.includes('rock') || gLower.includes('metal')) {
      energy = 85;
      relax = 25;
      dance = 65;
      focus = 40;
    } else if (gLower.includes('lo-fi') || gLower.includes('clássica')) {
      energy = 30;
      relax = 85;
      dance = 20;
      focus = 90;
    } else if (gLower.includes('eletrônica') || gLower.includes('pop') || gLower.includes('funk')) {
      energy = 80;
      relax = 35;
      dance = 90;
      focus = 45;
    } else if (gLower.includes('sertanejo') || gLower.includes('mpb') || gLower.includes('reggae')) {
      energy = 60;
      relax = 65;
      dance = 60;
      focus = 55;
    }

    if (mLower.includes('focus') || mLower.includes('study')) {
      focus = Math.max(focus, 85);
      relax = Math.max(relax, 60);
    }
    if (mLower.includes('sleep') || mLower.includes('relax')) {
      relax = Math.max(relax, 90);
      energy = Math.min(energy, 25);
    }
    if (mLower.includes('energy') || mLower.includes('games')) {
      energy = Math.max(energy, 85);
      dance = Math.max(dance, 75);
    }

    return { energyLevel: energy, relaxLevel: relax, danceLevel: dance, focusLevel: focus };
  }

  /**
   * Normalizes track object ensuring all metadata fields exist
   */
  static normalizeTrack(track: Partial<Track> & { id: string; title: string; artist: string; youtubeId: string }): Track {
    const now = new Date().toISOString();
    const genres = track.genres || (track.genre ? [track.genre] : ['Geral']);
    const moods = track.moods || [];
    
    const defaults = this.getDefaultMetricsForGenre(genres, moods);
    const sanitized = sanitizeYouTubeTitle(track.title || '', track.artist || '');

    return {
      id: track.id,
      title: sanitized.title || 'Sem Título',
      artist: sanitized.artist || 'Artista Desconhecido',
      youtubeId: track.youtubeId,
      youtubeUrl: track.youtubeUrl || `https://www.youtube.com/watch?v=${track.youtubeId}`,
      album: track.album || 'N/A',
      thumbnail: track.thumbnail || `https://img.youtube.com/vi/${track.youtubeId}/mqdefault.jpg`,
      duration: track.duration || 210,
      genre: genres[0] || 'Geral',
      genres,
      moods,
      languages: track.languages || ['Português'],
      decades: track.decades || ['2020'],
      instruments: track.instruments || [],
      energyLevel: track.energyLevel ?? defaults.energyLevel,
      relaxLevel: track.relaxLevel ?? defaults.relaxLevel,
      danceLevel: track.danceLevel ?? defaults.danceLevel,
      focusLevel: track.focusLevel ?? defaults.focusLevel,
      emotion: track.emotion || 'Alegre',
      weather: track.weather || 'Ensolarado',
      season: track.season || 'Verão',
      occasion: track.occasion || ['Viagem'],
      tags: track.tags || [],
      favorite: track.favorite || false,
      rating: track.rating || 0,
      timesPlayed: track.timesPlayed || 0,
      lastPlayed: track.lastPlayed || '',
      createdAt: track.createdAt || now,
      updatedAt: track.updatedAt || now,
      notes: track.notes || '',
      playlists: track.playlists || [],
      addedBy: track.addedBy || 'p-1',
      addedAt: track.addedAt || now,
      playsCount: track.playsCount || 0,
    };
  }

  /**
   * Enrich & batch normalize an array of tracks
   */
  static normalizeTrackList(tracks: Track[]): Track[] {
    return tracks.map((t) => this.normalizeTrack(t));
  }
}
