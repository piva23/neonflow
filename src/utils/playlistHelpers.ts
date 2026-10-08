import { Playlist, Track, PlaylistType } from '../types';
import { getYoutubeThumbnail } from './youtube';

export const MOOD_DEFINITIONS = [
  { id: 'Focus', name: 'Focus', icon: '🎯', color: 'from-blue-600 to-indigo-800', description: 'Músicas para manter o foco e concentração' },
  { id: 'Games', name: 'Games', icon: '🎮', color: 'from-purple-600 to-pink-700', description: 'Trilhas perfeitas para gameplays e jogos' },
  { id: 'Relax', name: 'Relax', icon: '🌿', color: 'from-emerald-600 to-teal-800', description: 'Canções calmas para desacelerar' },
  { id: 'Sleep', name: 'Sleep', icon: '🌙', color: 'from-slate-800 to-indigo-950', description: 'Sons tranquilos para uma boa noite de sono' },
  { id: 'Energy', name: 'Energy', icon: '⚡', color: 'from-amber-500 to-orange-700', description: 'Ritmos animados para acelerar o ritmo' },
  { id: 'Study', name: 'Study', icon: '📚', color: 'from-cyan-600 to-blue-800', description: 'Ambiente sonoro ideal para estudos e leituras' },
  { id: 'Night Drive', name: 'Night Drive', icon: '🌌', color: 'from-violet-900 via-purple-900 to-fuchsia-900', description: 'Sintetizadores e batidas para a estrada à noite' },
  { id: 'Family Time', name: 'Family Time', icon: '🏠', color: 'from-rose-500 to-pink-600', description: 'Sucessos que agradam todas as idades na casa' },
];

/**
 * Calculates dynamic automatic playlists based on global tracks
 */
export function generateAutomaticPlaylists(tracks: Track[]): Playlist[] {
  if (!tracks || tracks.length === 0) {
    return [];
  }
  const now = new Date().toISOString();

  // 1. Favoritas
  const favTracks = tracks.filter((t) => t.favorite === true);
  
  // 2. Recentes (Tocadas ou adicionadas recentemente)
  const recentTracks = [...tracks].sort((a, b) => {
    const dateA = new Date(a.lastPlayed || a.addedAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.lastPlayed || b.addedAt || b.createdAt || 0).getTime();
    return dateB - dateA;
  }).slice(0, 20);

  // 3. Mais reproduzidas
  const mostPlayedTracks = [...tracks].sort((a, b) => {
    const pA = a.timesPlayed !== undefined ? a.timesPlayed : (a.playsCount || 0);
    const pB = b.timesPlayed !== undefined ? b.timesPlayed : (b.playsCount || 0);
    return pB - pA;
  }).filter((t) => (t.timesPlayed || t.playsCount || 0) > 0);

  // 4. Nunca reproduzidas
  const neverPlayedTracks = tracks.filter((t) => (t.timesPlayed || t.playsCount || 0) === 0);

  // 5. Adicionadas recentemente
  const addedRecentlyTracks = [...tracks].sort((a, b) => {
    const dateA = new Date(a.addedAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.addedAt || b.createdAt || 0).getTime();
    return dateB - dateA;
  }).slice(0, 15);

  // 6. Maior duração
  const longestTracks = [...tracks].sort((a, b) => (b.duration || 0) - (a.duration || 0)).slice(0, 15);

  // 7. Menor duração
  const shortestTracks = [...tracks].sort((a, b) => (a.duration || 0) - (b.duration || 0)).slice(0, 15);

  return [
    {
      id: 'auto-fav',
      name: 'Favoritas',
      description: 'Músicas marcadas com coração por toda a família',
      coverColor: 'from-red-600 to-rose-700',
      coverType: 'mosaic',
      color: '#ef4444',
      icon: '❤️',
      createdAt: now,
      updatedAt: now,
      favorite: true,
      pinned: true,
      visibility: 'family',
      songs: favTracks.map((t) => t.id),
      tracks: favTracks,
      tags: ['Favoritas', 'Coração', 'Auto'],
      type: 'automatic',
      owner: 'system',
      isFamilyShared: true,
      createdBy: 'system',
    },
    {
      id: 'auto-recent',
      name: 'Recentes',
      description: 'Últimas canções tocadas ou adicionadas no NeonFlow',
      coverColor: 'from-purple-600 to-indigo-800',
      coverType: 'mosaic',
      color: '#8b5cf6',
      icon: '🕒',
      createdAt: now,
      updatedAt: now,
      favorite: false,
      pinned: true,
      visibility: 'family',
      songs: recentTracks.map((t) => t.id),
      tracks: recentTracks,
      tags: ['Recentes', 'Histórico'],
      type: 'automatic',
      owner: 'system',
      isFamilyShared: true,
      createdBy: 'system',
    },
    {
      id: 'auto-most-played',
      name: 'Mais Reproduzidas',
      description: 'Músicas no topo da parada da casa',
      coverColor: 'from-amber-500 to-yellow-700',
      coverType: 'mosaic',
      color: '#f59e0b',
      icon: '🔥',
      createdAt: now,
      updatedAt: now,
      favorite: false,
      pinned: false,
      visibility: 'family',
      songs: mostPlayedTracks.map((t) => t.id),
      tracks: mostPlayedTracks,
      tags: ['Sucessos', 'Hits', 'Mais Tocadas'],
      type: 'automatic',
      owner: 'system',
      isFamilyShared: true,
      createdBy: 'system',
    },
    {
      id: 'auto-never-played',
      name: 'Nunca Reproduzidas',
      description: 'Canções da biblioteca que ainda estão aguardando o primeiro play',
      coverColor: 'from-emerald-600 to-teal-800',
      coverType: 'mosaic',
      color: '#10b981',
      icon: '✨',
      createdAt: now,
      updatedAt: now,
      favorite: false,
      pinned: false,
      visibility: 'family',
      songs: neverPlayedTracks.map((t) => t.id),
      tracks: neverPlayedTracks,
      tags: ['Descoberta', 'Inéditas'],
      type: 'automatic',
      owner: 'system',
      isFamilyShared: true,
      createdBy: 'system',
    },
    {
      id: 'auto-added-recent',
      name: 'Adicionadas Recente',
      description: 'Músicas recém-chegadas à biblioteca familiar',
      coverColor: 'from-blue-600 to-cyan-700',
      coverType: 'mosaic',
      color: '#06b6d4',
      icon: '🆕',
      createdAt: now,
      updatedAt: now,
      favorite: false,
      pinned: false,
      visibility: 'family',
      songs: addedRecentlyTracks.map((t) => t.id),
      tracks: addedRecentlyTracks,
      tags: ['Novidades', 'Recém Adicionadas'],
      type: 'automatic',
      owner: 'system',
      isFamilyShared: true,
      createdBy: 'system',
    },
    {
      id: 'auto-longest',
      name: 'Maior Duração',
      description: 'Faixas longas para viagens e sessões profundas de audição',
      coverColor: 'from-violet-700 to-purple-900',
      coverType: 'mosaic',
      color: '#7c3aed',
      icon: '⏳',
      createdAt: now,
      updatedAt: now,
      favorite: false,
      pinned: false,
      visibility: 'family',
      songs: longestTracks.map((t) => t.id),
      tracks: longestTracks,
      tags: ['Longas', 'Sessão'],
      type: 'automatic',
      owner: 'system',
      isFamilyShared: true,
      createdBy: 'system',
    },
    {
      id: 'auto-shortest',
      name: 'Menor Duração',
      description: 'Músicas curtas, vinhetas e faixas dinâmicas',
      coverColor: 'from-pink-600 to-rose-800',
      coverType: 'mosaic',
      color: '#ec4899',
      icon: '⚡',
      createdAt: now,
      updatedAt: now,
      favorite: false,
      pinned: false,
      visibility: 'family',
      songs: shortestTracks.map((t) => t.id),
      tracks: shortestTracks,
      tags: ['Rápidas', 'Curtas'],
      type: 'automatic',
      owner: 'system',
      isFamilyShared: true,
      createdBy: 'system',
    }
  ];
}

/**
 * Calculates dynamic mood playlists based on mood tags or preset categories
 */
export function generateMoodPlaylists(tracks: Track[]): Playlist[] {
  if (!tracks || tracks.length === 0) {
    return [];
  }
  const now = new Date().toISOString();

  return MOOD_DEFINITIONS.map((m) => {
    // Filter tracks matching mood or related tags
    const moodTracks = tracks.filter((t) => {
      const moods = (t.moods || []).map((mod) => mod.toLowerCase());
      const tags = (t.tags || []).map((tag) => tag.toLowerCase());
      const genre = (t.genre || '').toLowerCase();
      const target = m.id.toLowerCase();

      return moods.includes(target) || tags.includes(target) || genre.includes(target);
    });

    return {
      id: `mood-${m.id.toLowerCase().replace(/\s+/g, '-')}`,
      name: m.name,
      description: m.description,
      coverColor: m.color,
      coverType: 'gradient',
      color: '#a855f7',
      icon: m.icon,
      createdAt: now,
      updatedAt: now,
      favorite: false,
      pinned: false,
      visibility: 'family',
      songs: moodTracks.map((t) => t.id),
      tracks: moodTracks,
      tags: [m.name, 'Mood'],
      mood: m.name,
      type: 'mood',
      owner: 'system',
      isFamilyShared: true,
      createdBy: 'system',
    };
  });
}

/**
 * Get thumbnails array for 2x2 mosaic box cover
 */
export function getPlaylistMosaicThumbnails(playlist: Playlist, globalTracks: Track[]): string[] {
  const tracksToUse = playlist.tracks && playlist.tracks.length > 0
    ? playlist.tracks
    : (playlist.songs || [])
        .map((id) => globalTracks.find((gt) => gt.id === id))
        .filter((t): t is Track => t !== undefined);

  const thumbs: string[] = [];
  for (const track of tracksToUse) {
    if (thumbs.length >= 4) break;
    const thumb = track.thumbnail || (track.youtubeId ? getYoutubeThumbnail(track.youtubeId) : '');
    if (thumb && !thumbs.includes(thumb)) {
      thumbs.push(thumb);
    }
  }

  return thumbs;
}

/**
 * Filters & sorts playlists
 */
export interface PlaylistFilterOptions {
  searchQuery?: string;
  type?: 'all' | PlaylistType | 'pinned' | 'favorite';
  mood?: string;
  sortBy?: 'alphabetical' | 'recent' | 'oldest' | 'most-songs' | 'fewest-songs' | 'manual';
}

export function filterAndSortPlaylists(playlists: Playlist[], options: PlaylistFilterOptions): Playlist[] {
  let result = [...playlists];

  // 1. Search Query (Name, Description, Tags, Mood, Type)
  if (options.searchQuery && options.searchQuery.trim() !== '') {
    const q = options.searchQuery.toLowerCase().trim();
    result = result.filter((p) => {
      const nameMatch = (p.name || '').toLowerCase().includes(q);
      const descMatch = (p.description || '').toLowerCase().includes(q);
      const tagsMatch = (p.tags || []).some((t) => t.toLowerCase().includes(q));
      const moodMatch = (p.mood || '').toLowerCase().includes(q);
      const typeMatch = (p.type || '').toLowerCase().includes(q);
      return nameMatch || descMatch || tagsMatch || moodMatch || typeMatch;
    });
  }

  // 2. Filter by Type / Section
  if (options.type && options.type !== 'all') {
    if (options.type === 'pinned') {
      result = result.filter((p) => p.pinned === true);
    } else if (options.type === 'favorite') {
      result = result.filter((p) => p.favorite === true);
    } else {
      result = result.filter((p) => p.type === options.type);
    }
  }

  // 3. Filter by Mood
  if (options.mood && options.mood !== 'all') {
    result = result.filter((p) => p.mood === options.mood || (p.tags || []).includes(options.mood!));
  }

  // 4. Sorting
  result.sort((a, b) => {
    // Pinned playlists always take precedence if manual or default
    if (options.sortBy === 'manual' || !options.sortBy) {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
    }

    if (options.sortBy === 'alphabetical') {
      return (a.name || '').localeCompare(b.name || '');
    }
    if (options.sortBy === 'recent') {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    }
    if (options.sortBy === 'oldest') {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateA - dateB;
    }
    if (options.sortBy === 'most-songs') {
      return (b.tracks?.length || b.songs?.length || 0) - (a.tracks?.length || a.songs?.length || 0);
    }
    if (options.sortBy === 'fewest-songs') {
      return (a.tracks?.length || a.songs?.length || 0) - (b.tracks?.length || b.songs?.length || 0);
    }

    return 0;
  });

  return result;
}
