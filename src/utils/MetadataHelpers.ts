import { Track } from '../types';

export interface MultiTrackFilters {
  searchQuery?: string;
  genres?: string[];
  moods?: string[];
  languages?: string[];
  decades?: string[];
  occasions?: string[];
  tags?: string[];
  minEnergy?: number;
  maxEnergy?: number;
  minRelax?: number;
  maxRelax?: number;
  minFocus?: number;
  maxFocus?: number;
  minDance?: number;
  maxDance?: number;
  weather?: string;
  season?: string;
  emotion?: string;
  onlyFavorites?: boolean;
  minRating?: number;
  addedByProfileId?: string;
  sourceType?: 'all' | 'youtube' | 'local';
}

/**
 * Formats a decade string for display (e.g. '80' -> 'Anos 80', '2000' -> 'Anos 2000')
 */
export function formatDecadeLabel(decade: string): string {
  if (!decade) return '';
  if (decade.toLowerCase().startsWith('anos')) return decade;
  return `Anos ${decade}`;
}

/**
 * Returns flag or icon representation for language
 */
export function getLanguageIcon(language: string): string {
  switch (language?.toLowerCase()) {
    case 'português':
      return '🇧🇷';
    case 'inglês':
      return '🇺🇸';
    case 'espanhol':
      return '🇪🇸';
    case 'japonês':
      return '🇯🇵';
    case 'instrumental':
      return '🎹';
    default:
      return '🌐';
  }
}

/**
 * Returns color class or style for level metrics (0 to 100)
 */
export function getMetricGradient(level: number, type: 'energy' | 'relax' | 'dance' | 'focus'): string {
  if (type === 'energy') {
    if (level > 75) return 'from-amber-500 to-red-600';
    if (level > 40) return 'from-yellow-500 to-amber-600';
    return 'from-blue-500 to-indigo-600';
  }
  if (type === 'relax') {
    if (level > 75) return 'from-emerald-500 to-teal-700';
    if (level > 40) return 'from-cyan-500 to-blue-600';
    return 'from-slate-600 to-zinc-800';
  }
  if (type === 'dance') {
    if (level > 75) return 'from-pink-500 to-purple-600';
    if (level > 40) return 'from-violet-500 to-fuchsia-600';
    return 'from-slate-600 to-zinc-700';
  }
  // Focus
  if (level > 75) return 'from-indigo-500 to-cyan-600';
  if (level > 40) return 'from-blue-600 to-indigo-700';
  return 'from-slate-600 to-zinc-800';
}

/**
 * Multi-criteria track filter evaluator
 */
export function filterTracksWithMetadata(tracks: Track[], filters: MultiTrackFilters): Track[] {
  return tracks.filter((track) => {
    // 1. Text Search Query
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase().trim();
      const titleMatch = (track.title || '').toLowerCase().includes(q);
      const artistMatch = (track.artist || '').toLowerCase().includes(q);
      const albumMatch = (track.album || '').toLowerCase().includes(q);
      const notesMatch = (track.notes || '').toLowerCase().includes(q);
      const tagsMatch = (track.tags || []).some((t) => t.toLowerCase().includes(q));
      const genreMatch = (track.genre || '').toLowerCase().includes(q) || (track.genres || []).some((g) => g.toLowerCase().includes(q));

      if (!titleMatch && !artistMatch && !albumMatch && !notesMatch && !tagsMatch && !genreMatch) {
        return false;
      }
    }

    // 2. Favorites, Rating & Source Type
    if (filters.onlyFavorites && !track.favorite) return false;
    if (filters.minRating && (track.rating || 0) < filters.minRating) return false;
    if (filters.addedByProfileId && track.addedBy !== filters.addedByProfileId) return false;
    if (filters.sourceType && filters.sourceType !== 'all') {
      const isLocal = track.source?.type === 'local';
      if (filters.sourceType === 'local' && !isLocal) return false;
      if (filters.sourceType === 'youtube' && isLocal) return false;
    }

    // 3. Genres (Supports legacy `genre` string or array `genres`)
    if (filters.genres && filters.genres.length > 0) {
      const trackGenres = [
        ...(track.genres || []),
        ...(track.genre ? [track.genre] : []),
      ].map((g) => g.toLowerCase());

      const matchesGenre = filters.genres.some((g) => trackGenres.includes(g.toLowerCase()));
      if (!matchesGenre) return false;
    }

    // 4. Moods
    if (filters.moods && filters.moods.length > 0) {
      const trackMoods = (track.moods || []).map((m) => m.toLowerCase());
      const matchesMood = filters.moods.some((m) => trackMoods.includes(m.toLowerCase()));
      if (!matchesMood) return false;
    }

    // 5. Languages
    if (filters.languages && filters.languages.length > 0) {
      const trackLangs = (track.languages || []).map((l) => l.toLowerCase());
      const matchesLang = filters.languages.some((l) => trackLangs.includes(l.toLowerCase()));
      if (!matchesLang) return false;
    }

    // 6. Decades
    if (filters.decades && filters.decades.length > 0) {
      const trackDecades = (track.decades || []).map((d) => d.toString().toLowerCase());
      const matchesDecade = filters.decades.some((d) =>
        trackDecades.some((td) => td.includes(d.toString().toLowerCase()))
      );
      if (!matchesDecade) return false;
    }

    // 7. Occasions
    if (filters.occasions && filters.occasions.length > 0) {
      const trackOccasions = Array.isArray(track.occasion)
        ? track.occasion.map((o) => o.toLowerCase())
        : track.occasion
        ? [track.occasion.toLowerCase()]
        : [];

      const matchesOccasion = filters.occasions.some((o) => trackOccasions.includes(o.toLowerCase()));
      if (!matchesOccasion) return false;
    }

    // 8. Tags
    if (filters.tags && filters.tags.length > 0) {
      const trackTags = (track.tags || []).map((t) => t.toLowerCase());
      const matchesTag = filters.tags.some((t) => trackTags.includes(t.toLowerCase()));
      if (!matchesTag) return false;
    }

    // 9. Weather, Season, Emotion
    if (filters.weather && track.weather && track.weather.toLowerCase() !== filters.weather.toLowerCase()) {
      return false;
    }
    if (filters.season && track.season && track.season.toLowerCase() !== filters.season.toLowerCase()) {
      return false;
    }
    if (filters.emotion && track.emotion && track.emotion.toLowerCase() !== filters.emotion.toLowerCase()) {
      return false;
    }

    // 10. Level Sliders (Energy, Relax, Focus, Dance)
    const energy = track.energyLevel ?? 50;
    if (filters.minEnergy !== undefined && energy < filters.minEnergy) return false;
    if (filters.maxEnergy !== undefined && energy > filters.maxEnergy) return false;

    const relax = track.relaxLevel ?? 50;
    if (filters.minRelax !== undefined && relax < filters.minRelax) return false;
    if (filters.maxRelax !== undefined && relax > filters.maxRelax) return false;

    const focus = track.focusLevel ?? 50;
    if (filters.minFocus !== undefined && focus < filters.minFocus) return false;
    if (filters.maxFocus !== undefined && focus > filters.maxFocus) return false;

    const dance = track.danceLevel ?? 50;
    if (filters.minDance !== undefined && dance < filters.minDance) return false;
    if (filters.maxDance !== undefined && dance > filters.maxDance) return false;

    return true;
  });
}

/**
 * Calculates aggregate metadata statistics for a list of tracks
 */
export function calculateTrackLibraryStats(tracks: Track[]) {
  if (tracks.length === 0) {
    return {
      totalTracks: 0,
      avgEnergy: 0,
      avgRelax: 0,
      avgDance: 0,
      avgFocus: 0,
      topGenre: 'N/A',
      topMood: 'N/A',
      topDecade: 'N/A',
      languageCounts: {} as Record<string, number>,
    };
  }

  let totalEnergy = 0;
  let totalRelax = 0;
  let totalDance = 0;
  let totalFocus = 0;

  const genreCounts: Record<string, number> = {};
  const moodCounts: Record<string, number> = {};
  const decadeCounts: Record<string, number> = {};
  const languageCounts: Record<string, number> = {};

  tracks.forEach((t) => {
    totalEnergy += t.energyLevel ?? 50;
    totalRelax += t.relaxLevel ?? 50;
    totalDance += t.danceLevel ?? 50;
    totalFocus += t.focusLevel ?? 50;

    const allGenres = [...(t.genres || []), ...(t.genre ? [t.genre] : [])];
    allGenres.forEach((g) => {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });

    (t.moods || []).forEach((m) => {
      moodCounts[m] = (moodCounts[m] || 0) + 1;
    });

    (t.decades || []).forEach((d) => {
      decadeCounts[d] = (decadeCounts[d] || 0) + 1;
    });

    (t.languages || []).forEach((l) => {
      languageCounts[l] = (languageCounts[l] || 0) + 1;
    });
  });

  const getTopKey = (counts: Record<string, number>) => {
    const entries = Object.entries(counts);
    if (entries.length === 0) return 'N/A';
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  };

  return {
    totalTracks: tracks.length,
    avgEnergy: Math.round(totalEnergy / tracks.length),
    avgRelax: Math.round(totalRelax / tracks.length),
    avgDance: Math.round(totalDance / tracks.length),
    avgFocus: Math.round(totalFocus / tracks.length),
    topGenre: getTopKey(genreCounts),
    topMood: getTopKey(moodCounts),
    topDecade: getTopKey(decadeCounts),
    languageCounts,
  };
}
