import { useState, useMemo } from 'react';
import { usePlaylist } from '../contexts/PlaylistContext';
import { useProfile } from '../contexts/ProfileContext';
import { Playlist, PlaylistType } from '../types';
import { filterAndSortPlaylists, PlaylistFilterOptions } from '../utils/playlistHelpers';
import { toast } from 'react-hot-toast';

export type PlaylistTabFilter = 'all' | 'personal' | 'family' | 'mood' | 'automatic' | 'favorite' | 'pinned';

export function usePlaylistsFilter() {
  const { playlists } = usePlaylist();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<PlaylistTabFilter>('all');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [sortBy, setSortBy] = useState<PlaylistFilterOptions['sortBy']>('manual');

  const filteredPlaylists = useMemo(() => {
    let typeParam: PlaylistFilterOptions['type'] = 'all';
    if (activeTab === 'personal') typeParam = 'personal';
    else if (activeTab === 'family') typeParam = 'family';
    else if (activeTab === 'mood') typeParam = 'mood';
    else if (activeTab === 'automatic') typeParam = 'automatic';
    else if (activeTab === 'favorite') typeParam = 'favorite';
    else if (activeTab === 'pinned') typeParam = 'pinned';

    return filterAndSortPlaylists(playlists, {
      searchQuery,
      type: typeParam,
      mood: selectedMood,
      sortBy,
    });
  }, [playlists, searchQuery, activeTab, selectedMood, sortBy]);

  return {
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    selectedMood,
    setSelectedMood,
    sortBy,
    setSortBy,
    filteredPlaylists,
  };
}

export function usePlaylistSystem() {
  const playlistContext = usePlaylist();
  const { activeProfile } = useProfile();

  const {
    playlists,
    customPlaylists,
    automaticPlaylists,
    moodPlaylists,
    globalTracks,
    createPlaylist,
    updatePlaylist,
    duplicatePlaylist,
    deletePlaylist,
    toggleFavoritePlaylist,
    togglePinPlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
  } = playlistContext;

  const stats = useMemo(() => {
    return {
      totalPlaylists: playlists.length,
      customCount: customPlaylists.length,
      automaticCount: automaticPlaylists.length,
      moodCount: moodPlaylists.length,
      favoriteCount: playlists.filter((p) => p.favorite).length,
      pinnedCount: playlists.filter((p) => p.pinned).length,
    };
  }, [playlists, customPlaylists, automaticPlaylists, moodPlaylists]);

  const handleDuplicate = (playlist: Playlist) => {
    const duplicated = duplicatePlaylist(playlist, activeProfile?.id);
    toast.success(`Playlist "${playlist.name}" duplicada com sucesso!`);
    return duplicated;
  };

  const handleToggleFavorite = (playlist: Playlist) => {
    toggleFavoritePlaylist(playlist.id);
    const isFav = !playlist.favorite;
    toast.success(
      isFav
        ? `Playlist "${playlist.name}" adicionada aos favoritos!`
        : `Playlist "${playlist.name}" removida dos favoritos.`
    );
  };

  const handleTogglePin = (playlist: Playlist) => {
    togglePinPlaylist(playlist.id);
    const isPinned = !playlist.pinned;
    toast.success(
      isPinned
        ? `Playlist "${playlist.name}" fixada no topo!`
        : `Playlist "${playlist.name}" desfixada.`
    );
  };

  const handleDelete = (playlist: Playlist) => {
    if (playlist.type === 'automatic' || playlist.type === 'mood') {
      toast.error('Playlists automáticas do sistema não podem ser excluídas.');
      return;
    }

    if (window.confirm(`Tem certeza de que deseja excluir permanentemente a playlist "${playlist.name}"?`)) {
      deletePlaylist(playlist.id);
      toast.success(`Playlist "${playlist.name}" excluída.`);
    }
  };

  return {
    ...playlistContext,
    stats,
    handleDuplicate,
    handleToggleFavorite,
    handleTogglePin,
    handleDelete,
  };
}
