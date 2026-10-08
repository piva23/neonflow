import { usePlaylist } from '../contexts/PlaylistContext';
import { MusicRepository, ValidationResult } from '../repositories/MusicRepository';
import { Track } from '../types';

export function useLibrary() {
  const {
    globalTracks,
    addTrackToLibrary,
    updateTrack,
    deleteTrackFromLibrary,
    duplicateTrackInLibrary,
    toggleFavoriteTrack,
    updateTrackRating,
  } = usePlaylist();

  const validateTrack = (
    title: string,
    artist: string,
    youtubeUrlOrId: string,
    existingId?: string
  ): ValidationResult => {
    return MusicRepository.validateTrackInput(title, artist, youtubeUrlOrId, existingId);
  };

  const getTrackById = (id: string): Track | undefined => {
    return globalTracks.find((t) => t.id === id);
  };

  const searchTracks = (query: string): Track[] => {
    if (!query || !query.trim()) return globalTracks;
    const q = query.toLowerCase().trim();
    return globalTracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.genre && t.genre.toLowerCase().includes(q)) ||
        (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
    );
  };

  const favorites = globalTracks.filter((t) => Boolean(t.favorite));

  return {
    tracks: globalTracks,
    globalTracks,
    addTrack: addTrackToLibrary,
    updateTrack,
    deleteTrack: deleteTrackFromLibrary,
    duplicateTrack: duplicateTrackInLibrary,
    toggleFavorite: toggleFavoriteTrack,
    updateRating: updateTrackRating,
    searchTracks,
    validateTrack,
    getTrackById,
    favorites,
  };
}
