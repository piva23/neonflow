import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Playlist, Track, PlaylistType } from '../types';
import { MusicRepository, PlaylistRepository } from '../repositories';
import { playerEngine } from '../core/player';
import { mediaLibrary } from '../core/media';
import { MusicMetadataService } from '../services/MusicMetadataService';
import { progressionObserverBridge } from '../core/progression/ProgressionObserverBridge';
import { generateAutomaticPlaylists, generateMoodPlaylists } from '../utils/playlistHelpers';
import { extractYoutubeId as ytExtract } from '../utils/youtube';
import { CreatePlaylistInput, UpdatePlaylistInput } from '../services/playlistService';

export const extractYoutubeId = ytExtract;

interface PlaylistContextType {
  // Lists
  customPlaylists: Playlist[];
  automaticPlaylists: Playlist[];
  moodPlaylists: Playlist[];
  playlists: Playlist[]; // All playlists combined
  globalTracks: Track[];

  // Track Actions
  addTrackToLibrary: (
    title: string,
    artist: string,
    youtubeUrlOrId: string,
    profileId: string,
    extraFields?: Partial<Track>
  ) => Track | null;
  addImportedTrack: (track: Track, profileId?: string) => void;
  deleteTrackFromLibrary: (trackId: string) => void;
  duplicateTrackInLibrary: (trackId: string) => Track | null;
  toggleFavoriteTrack: (trackId: string) => void;
  updateTrackRating: (trackId: string, rating: number) => void;
  updateTrack: (trackId: string, updatedFields: Partial<Track>) => void;

  // Custom Playlist CRUD
  createPlaylist: (
    nameOrInput: string | CreatePlaylistInput,
    description?: string,
    coverColor?: string,
    isFamilyShared?: boolean,
    profileId?: string
  ) => Playlist;
  updatePlaylist: (id: string, updatedFields: UpdatePlaylistInput) => void;
  duplicatePlaylist: (playlist: Playlist, newOwner?: string) => Playlist;
  deletePlaylist: (playlistId: string) => void;
  toggleFavoritePlaylist: (playlistId: string) => void;
  togglePinPlaylist: (playlistId: string) => void;

  // Playlist Tracks operations
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  reorderPlaylistTracks: (playlistId: string, newTrackIds: string[]) => void;
  recordPlaylistPlay: (playlistId: string) => void;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export const PlaylistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load global tracks using MusicRepository
  const [globalTracks, setGlobalTracks] = useState<Track[]>(() => {
    return MusicRepository.getAll();
  });

  // Load custom playlists using PlaylistRepository
  const [customPlaylists, setCustomPlaylists] = useState<Playlist[]>(() => {
    return PlaylistRepository.getAll();
  });

  // Save changes via repositories
  useEffect(() => {
    MusicRepository.saveAll(globalTracks);
  }, [globalTracks]);

  useEffect(() => {
    PlaylistRepository.saveAll(customPlaylists);
  }, [customPlaylists]);

  // Compute automatic playlists dynamically from globalTracks
  const automaticPlaylists = useMemo(() => {
    return generateAutomaticPlaylists(globalTracks);
  }, [globalTracks]);

  // Compute mood playlists dynamically from globalTracks
  const moodPlaylists = useMemo(() => {
    return generateMoodPlaylists(globalTracks);
  }, [globalTracks]);

  // Unified list of populated playlists (starts 100% empty, zero mock/auto-injected playlists)
  const playlists = useMemo(() => {
    return customPlaylists.map((pl) => {
      const songIds = pl.songs || (pl.tracks || []).map((t) => t.id);
      const populatedTracks = songIds
        .map((id) => globalTracks.find((gt) => gt.id === id))
        .filter((t): t is Track => t !== undefined);

      return {
        ...pl,
        songs: songIds,
        tracks: populatedTracks,
      };
    });
  }, [customPlaylists, globalTracks]);

  // ================= LIBRARY TRACK ACTIONS =================
  const addTrackToLibrary = useCallback(
    (
      title: string,
      artist: string,
      youtubeUrlOrId: string,
      profileId: string,
      extraFields?: Partial<Track>
    ): Track | null => {
      try {
        const newTrack = MusicRepository.addTrack(
          title,
          artist,
          youtubeUrlOrId,
          profileId,
          extraFields
        );
        setGlobalTracks((prev) => [newTrack, ...prev.filter((t) => t.id !== newTrack.id)]);
        progressionObserverBridge.onTrackAdded(newTrack.id, profileId || 'm-1');
        return newTrack;
      } catch (err) {
        console.error('[PlaylistContext] Error adding track:', err);
        return null;
      }
    },
    []
  );

  const addImportedTrack = useCallback((track: Track, profileId?: string) => {
    MusicRepository.addDirectTrack(track);
    setGlobalTracks((prev) => [track, ...prev.filter((t) => t.id !== track.id)]);
    progressionObserverBridge.onTrackAdded(track.id, profileId || 'm-1');
  }, []);

  const deleteTrackFromLibrary = useCallback((trackId: string) => {
    // Clean local media if track is local
    mediaLibrary.deleteTrackMedia(trackId).catch(() => {});

    MusicRepository.deleteTrack(trackId);
    setGlobalTracks((prev) => {
      const updated = prev.filter((t) => t.id !== trackId);
      return updated;
    });
    setCustomPlaylists((prev) =>
      prev.map((pl) => ({
        ...pl,
        songs: (pl.songs || []).filter((id) => id !== trackId),
        tracks: (pl.tracks || []).filter((t) => t.id !== trackId),
        updatedAt: new Date().toISOString(),
      }))
    );

    // Notify PlayerEngine for cascading cleanup/playback advance
    playerEngine.handleTrackDeleted(trackId);
  }, []);

  const duplicateTrackInLibrary = useCallback((trackId: string): Track | null => {
    const copy = MusicRepository.duplicateTrack(trackId);
    if (copy) {
      setGlobalTracks((prev) => [copy, ...prev]);
    }
    return copy;
  }, []);

  const toggleFavoriteTrack = useCallback((trackId: string) => {
    const newFavState = MusicRepository.toggleFavorite(trackId);
    setGlobalTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, favorite: newFavState } : t))
    );
    if (newFavState) {
      progressionObserverBridge.onTrackLiked(trackId, 'm-1');
    }
  }, []);

  const updateTrackRating = useCallback((trackId: string, rating: number) => {
    MusicRepository.updateRating(trackId, rating);
    setGlobalTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, rating } : t))
    );
  }, []);

  const updateTrack = useCallback((trackId: string, updatedFields: Partial<Track>) => {
    const updated = MusicRepository.updateTrack(trackId, updatedFields);
    if (updated) {
      setGlobalTracks((prev) =>
        prev.map((t) => (t.id === trackId ? updated : t))
      );
      // Sync update with PlayerEngine
      playerEngine.handleTrackUpdated(updated);
    }
  }, []);

  // ================= CUSTOM PLAYLIST CRUD =================
  const createPlaylist = useCallback(
    (
      nameOrInput: string | CreatePlaylistInput,
      description?: string,
      coverColor?: string,
      isFamilyShared?: boolean,
      profileId?: string
    ): Playlist => {
      let inputObj: CreatePlaylistInput;

      if (typeof nameOrInput === 'string') {
        inputObj = {
          name: nameOrInput,
          description: description || '',
          coverColor: coverColor || 'from-indigo-600 to-purple-600',
          cover: coverColor || 'from-indigo-600 to-purple-600',
          coverType: 'gradient',
          isFamilyShared: isFamilyShared ?? true,
          createdBy: profileId || 'p-1',
          owner: profileId || 'p-1',
          visibility: isFamilyShared ? 'family' : 'private',
          type: isFamilyShared ? 'family' : 'personal',
        };
      } else {
        inputObj = nameOrInput;
      }

      const created = PlaylistRepository.create(inputObj);
      setCustomPlaylists((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
      progressionObserverBridge.onPlaylistCreated(
        created.id,
        Boolean(created.isFamilyShared),
        created.createdBy || 'm-1',
        'fam-1',
        created.songs?.length || 0
      );
      return created;
    },
    []
  );

  const updatePlaylist = useCallback((id: string, updatedFields: UpdatePlaylistInput) => {
    const updated = PlaylistRepository.update(id, updatedFields);
    if (updated) {
      setCustomPlaylists((prev) =>
        prev.map((pl) => (pl.id === id ? updated : pl))
      );
    }
  }, []);

  const duplicatePlaylist = useCallback((playlist: Playlist, newOwner?: string): Playlist => {
    const copy = PlaylistRepository.duplicate(playlist, newOwner);
    setCustomPlaylists((prev) => [copy, ...prev]);
    return copy;
  }, []);

  const deletePlaylist = useCallback((playlistId: string) => {
    PlaylistRepository.delete(playlistId);
    setCustomPlaylists((prev) => {
      const updated = prev.filter((pl) => pl.id !== playlistId);
      PlaylistRepository.saveAll(updated);
      return updated;
    });
  }, []);

  const toggleFavoritePlaylist = useCallback((playlistId: string) => {
    setCustomPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          const updated = {
            ...pl,
            favorite: !pl.favorite,
            updatedAt: new Date().toISOString(),
          };
          PlaylistRepository.update(playlistId, { favorite: updated.favorite });
          return updated;
        }
        return pl;
      })
    );
  }, []);

  const togglePinPlaylist = useCallback((playlistId: string) => {
    setCustomPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          const updated = {
            ...pl,
            pinned: !pl.pinned,
            updatedAt: new Date().toISOString(),
          };
          PlaylistRepository.update(playlistId, { pinned: updated.pinned });
          return updated;
        }
        return pl;
      })
    );
  }, []);

  // ================= PLAYLIST TRACK OPERATORS =================
  const addTrackToPlaylist = useCallback((playlistId: string, trackId: string) => {
    PlaylistRepository.addTrackToPlaylist(playlistId, trackId);
    setCustomPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          const currentSongs = pl.songs || [];
          if (currentSongs.includes(trackId)) return pl;
          return {
            ...pl,
            songs: [...currentSongs, trackId],
            updatedAt: new Date().toISOString(),
          };
        }
        return pl;
      })
    );
  }, []);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    PlaylistRepository.removeTrackFromPlaylist(playlistId, trackId);
    setCustomPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          const currentSongs = pl.songs || [];
          return {
            ...pl,
            songs: currentSongs.filter((id) => id !== trackId),
            tracks: (pl.tracks || []).filter((t) => t.id !== trackId),
            updatedAt: new Date().toISOString(),
          };
        }
        return pl;
      })
    );
  }, []);

  const reorderPlaylistTracks = useCallback((playlistId: string, newTrackIds: string[]) => {
    PlaylistRepository.update(playlistId, { songs: newTrackIds });
    setCustomPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === playlistId) {
          return {
            ...pl,
            songs: newTrackIds,
            updatedAt: new Date().toISOString(),
          };
        }
        return pl;
      })
    );
  }, []);

  const recordPlaylistPlay = useCallback((playlistId: string) => {
    const pl = PlaylistRepository.getById(playlistId);
    if (pl) {
      PlaylistRepository.update(playlistId, {
        timesPlayed: (pl.timesPlayed || 0) + 1,
        lastPlayed: new Date().toISOString(),
      });
    }
  }, []);

  return (
    <PlaylistContext.Provider
      value={{
        customPlaylists,
        automaticPlaylists,
        moodPlaylists,
        playlists,
        globalTracks,
        addTrackToLibrary,
        addImportedTrack,
        deleteTrackFromLibrary,
        duplicateTrackInLibrary,
        toggleFavoriteTrack,
        updateTrackRating,
        updateTrack,
        createPlaylist,
        updatePlaylist,
        duplicatePlaylist,
        deletePlaylist,
        toggleFavoritePlaylist,
        togglePinPlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        reorderPlaylistTracks,
        recordPlaylistPlay,
      }}
    >
      {children}
    </PlaylistContext.Provider>
  );
};

export const usePlaylist = () => {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
};
