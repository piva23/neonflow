import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ListMusic,
  Plus,
  Play,
  Trash,
  ChevronLeft,
  Music,
  Info,
  Share2,
  Sparkles,
  FolderHeart,
  Search,
  Filter,
  ArrowUpDown,
  Heart,
  Pin,
  Edit2,
  Copy,
  Trash2,
  Users,
  Lock,
  Flame,
  Globe,
  Clock,
  X,
  Library
} from 'lucide-react';
import { usePlaylist, useProfile, usePlayer, useTheme, usePlaylistSystem, usePlaylistsFilter } from '../hooks';
import { PageHeader, Button, Input, GlassCard, EmptyState, PlaylistCard, CreatePlaylistModal, EditPlaylistModal, AddToPlaylistModal, Modal, TrackOptionsMenu } from '../components';
import { Playlist, Track } from '../types';
import { getThemeColors } from '../utils/themeHelpers';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { MOOD_DEFINITIONS, getPlaylistMosaicThumbnails } from '../utils/playlistHelpers';

export const Playlists: React.FC = () => {
  const navigate = useNavigate();
  const { activeProfile, profiles } = useProfile();
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { activeTheme } = useTheme();

  const themeColors = getThemeColors(activeTheme);

  const {
    playlists,
    globalTracks,
    recordPlaylistPlay,
    removeTrackFromPlaylist,
    handleDuplicate,
    handleToggleFavorite,
    handleTogglePin,
    handleDelete,
  } = usePlaylistSystem();

  const {
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    selectedMood,
    setSelectedMood,
    sortBy,
    setSortBy,
    filteredPlaylists,
  } = usePlaylistsFilter();

  // Navigation & Modals state
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);
  const [pickerTrack, setPickerTrack] = useState<Track | null>(null);

  // Search inside playlist tracklist
  const [playlistTrackSearch, setPlaylistTrackSearch] = useState('');

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  const handlePlayEntirePlaylist = (playlist: Playlist) => {
    if (!playlist.tracks || playlist.tracks.length === 0) {
      toast.error('Essa playlist não possui músicas cadastradas!');
      return;
    }
    recordPlaylistPlay(playlist.id);
    playTrack(playlist.tracks[0], playlist.tracks);
    toast.success(`Tocando a playlist "${playlist.name}"!`);
  };

  const handleRemoveTrack = (playlistId: string, trackId: string, trackTitle: string) => {
    removeTrackFromPlaylist(playlistId, trackId);
    toast.success(`Música "${trackTitle}" removida da playlist.`);
  };

  // Filtered tracks inside selected playlist detail view
  const filteredPlaylistTracks = useMemo(() => {
    if (!selectedPlaylist) return [];
    const tracks = selectedPlaylist.tracks || [];
    if (!playlistTrackSearch.trim()) return tracks;

    const q = playlistTrackSearch.toLowerCase().trim();
    return tracks.filter((t) => {
      const title = (t.title || '').toLowerCase();
      const artist = (t.artist || '').toLowerCase();
      const album = (t.album || '').toLowerCase();
      return title.includes(q) || artist.includes(q) || album.includes(q);
    });
  }, [selectedPlaylist, playlistTrackSearch]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* ================= PLAYLIST DETAILS VIEW ================= */}
      {selectedPlaylist ? (
        <div className="flex flex-col gap-6">
          
          {/* Back Action link */}
          <button
            onClick={() => setSelectedPlaylistId(null)}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-text-muted hover:text-white transition-colors cursor-pointer self-start bg-white/5 border border-white/5 px-3 py-1.5 rounded-xl hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar para Coleções
          </button>

          {/* Playlist Cover Banner */}
          <div className="relative rounded-3xl p-6 md:p-8 overflow-hidden border border-brand-border/80 flex flex-col md:flex-row md:items-end justify-between gap-6 min-h-[220px]">
            {/* Background blur tint */}
            <div className={`absolute inset-0 bg-gradient-to-br ${selectedPlaylist.coverColor || 'from-indigo-600 to-purple-800'} opacity-25 filter blur-xl`} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c13] via-[#0b0c13]/70 to-transparent" />

            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 relative z-10">
              
              {/* Cover Art Display */}
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden bg-brand-surface border border-white/10 flex items-center justify-center text-white shadow-2xl shrink-0 relative">
                {selectedPlaylist.coverType === 'image' && selectedPlaylist.cover && selectedPlaylist.cover.startsWith('http') ? (
                  <img src={selectedPlaylist.cover} alt={selectedPlaylist.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : getPlaylistMosaicThumbnails(selectedPlaylist, globalTracks).length >= 4 ? (
                  <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5">
                    {getPlaylistMosaicThumbnails(selectedPlaylist, globalTracks).slice(0, 4).map((thumb, idx) => (
                      <img key={idx} src={thumb} alt="mosaic" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ))}
                  </div>
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${selectedPlaylist.coverColor || 'from-indigo-600 to-purple-600'} flex items-center justify-center text-3xl md:text-4xl font-bold`}>
                    {selectedPlaylist.icon || <ListMusic className="w-12 h-12" />}
                  </div>
                )}
              </div>

              {/* Title & Info */}
              <div className="flex flex-col min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-white/10 text-white shadow-md flex items-center gap-1
                    ${selectedPlaylist.type === 'automatic' ? 'bg-amber-500' : selectedPlaylist.type === 'mood' ? 'bg-pink-600' : selectedPlaylist.isFamilyShared ? 'bg-brand-purple' : 'bg-zinc-800'}
                  `}>
                    {selectedPlaylist.type === 'automatic' ? 'Automática' : selectedPlaylist.type === 'mood' ? 'Mood' : selectedPlaylist.isFamilyShared ? 'Família 🏠' : 'Privada 🔒'}
                  </span>

                  {selectedPlaylist.mood && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-pink/20 text-brand-pink border border-brand-pink/30">
                      {selectedPlaylist.mood}
                    </span>
                  )}

                  <span className="text-3xs font-extrabold uppercase tracking-wider text-brand-text-muted">
                    {selectedPlaylist.tracks?.length || 0} músicas
                  </span>
                </div>

                <h2 className="text-2xl md:text-4xl font-black font-display text-white tracking-tight leading-none mb-2.5 flex items-center gap-2">
                  <span>{selectedPlaylist.name}</span>
                  {selectedPlaylist.favorite && <Heart className="w-6 h-6 fill-red-500 text-red-500" />}
                  {selectedPlaylist.pinned && <Pin className="w-5 h-5 fill-brand-purple text-brand-purple" />}
                </h2>

                <p className="text-xs md:text-sm text-brand-text-muted max-w-xl font-medium leading-relaxed mb-3">
                  {selectedPlaylist.description || 'Playlist sem descrição cadastrada.'}
                </p>

                {/* Tags */}
                {selectedPlaylist.tags && selectedPlaylist.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPlaylist.tags.map((tag) => (
                      <span key={tag} className="text-3xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-brand-text-muted">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Action Bar inside Header */}
            <div className="flex flex-wrap items-center gap-2.5 relative z-10 self-start md:self-end">
              
              <Button
                onClick={() => handlePlayEntirePlaylist(selectedPlaylist)}
                disabled={!selectedPlaylist.tracks || selectedPlaylist.tracks.length === 0}
                variant="primary"
                glow
              >
                <Play className="w-4.5 h-4.5 fill-white" /> Tocar Tudo
              </Button>

              <button
                onClick={() => handleToggleFavorite(selectedPlaylist)}
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer
                  ${selectedPlaylist.favorite
                    ? 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-brand-surface border-brand-border text-brand-text-muted hover:text-white'
                  }
                `}
                title={selectedPlaylist.favorite ? 'Desfavoritar' : 'Favoritar'}
              >
                <Heart className={`w-4 h-4 ${selectedPlaylist.favorite ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={() => handleTogglePin(selectedPlaylist)}
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer
                  ${selectedPlaylist.pinned
                    ? 'bg-brand-purple/30 border-brand-purple text-brand-purple-light'
                    : 'bg-brand-surface border-brand-border text-brand-text-muted hover:text-white'
                  }
                `}
                title={selectedPlaylist.pinned ? 'Desfixar' : 'Fixar no topo'}
              >
                <Pin className={`w-4 h-4 ${selectedPlaylist.pinned ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={() => handleDuplicate(selectedPlaylist)}
                className="p-2.5 rounded-xl bg-brand-surface border border-brand-border text-brand-text-muted hover:text-white transition-colors cursor-pointer"
                title="Duplicar Playlist"
              >
                <Copy className="w-4 h-4" />
              </button>

              <Button
                onClick={() => setEditingPlaylist(selectedPlaylist)}
                variant="secondary"
                size="sm"
              >
                <Edit2 className="w-4 h-4" /> Editar Detalhes
              </Button>

              <Button
                onClick={() => setPlaylistToDelete(selectedPlaylist)}
                variant="danger"
                size="sm"
              >
                <Trash2 className="w-4 h-4" /> Excluir Playlist
              </Button>

            </div>

          </div>

          {/* ================= TRACKLIST SECTION ================= */}
          <div className="flex flex-col gap-4">
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-text-muted flex items-center gap-2">
                <Music className="w-4 h-4 text-brand-purple-light" />
                Faixas da Playlist ({selectedPlaylist.tracks?.length || 0})
              </h3>

              {/* Filter tracks search */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                  <input
                    type="text"
                    placeholder="Filtrar faixas nesta playlist..."
                    value={playlistTrackSearch}
                    onChange={(e) => setPlaylistTrackSearch(e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border/80 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white focus:outline-none focus:border-brand-purple"
                  />
                  {playlistTrackSearch && (
                    <button onClick={() => setPlaylistTrackSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <Button onClick={() => navigate('/biblioteca')} variant="ghost" size="sm">
                  <Library className="w-3.5 h-3.5" /> Adicionar Músicas
                </Button>
              </div>
            </div>

            {/* Empty tracklist state */}
            {!selectedPlaylist.tracks || selectedPlaylist.tracks.length === 0 ? (
              <EmptyState
                title="Playlist sem músicas"
                description="Adicione canções a esta coleção a partir da Biblioteca Compartilhada!"
                actionLabel="Ir para Biblioteca"
                onActionClick={() => navigate('/biblioteca')}
              />
            ) : filteredPlaylistTracks.length === 0 ? (
              <EmptyState
                title="Nenhuma música corresponde ao filtro"
                description="Tente pesquisar por outro nome ou limpe a busca."
                actionLabel="Limpar busca"
                onActionClick={() => setPlaylistTrackSearch('')}
              />
            ) : (
              <div className="flex flex-col gap-2">
                {filteredPlaylistTracks.map((track, idx) => {
                  const isCurrent = currentTrack?.id === track.id;
                  const adder = profiles.find((p) => p.id === track.addedBy);

                  return (
                    <div
                      key={track.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 group
                        ${isCurrent
                          ? 'bg-brand-purple/15 border-brand-purple/40 shadow-lg'
                          : 'bg-brand-card/40 border-brand-border/60 hover:bg-brand-surface/60 hover:border-brand-purple/30'
                        }
                      `}
                    >
                      {/* Track info */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <span className="text-xs font-mono font-black text-brand-text-muted/60 w-5 text-center">
                          {idx + 1}
                        </span>

                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-brand-surface relative shrink-0">
                          <img
                            src={track.thumbnail || `https://img.youtube.com/vi/${track.youtubeId}/mqdefault.jpg`}
                            alt={track.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            onClick={() => playTrack(track, selectedPlaylist.tracks)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                          >
                            {isCurrent && isPlaying ? (
                              <span className="flex gap-0.5 items-end justify-center">
                                <span className="w-1 bg-brand-cyan h-2.5 rounded-full animate-bounce" />
                                <span className="w-1 bg-brand-cyan h-4 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                                <span className="w-1 bg-brand-cyan h-2 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                              </span>
                            ) : (
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            )}
                          </button>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className={`text-sm font-bold truncate leading-snug group-hover:text-brand-purple-light transition-colors ${isCurrent ? 'text-brand-purple-light' : 'text-white'}`}>
                            {track.title}
                          </h4>
                          <p className="text-2xs text-brand-text-muted truncate">
                            {track.artist} {track.album && track.album !== 'N/A' ? `• ${track.album}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Right Meta & Actions */}
                      <div className="flex items-center gap-4 shrink-0">
                        {adder && (
                          <div className="hidden md:flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-full px-2.5 py-0.5">
                            <span className="text-xs select-none">{adder.avatar}</span>
                            <span className="text-3xs font-black uppercase text-white" style={{ color: adder.color }}>
                              {adder.name}
                            </span>
                          </div>
                        )}

                        <button
                          onClick={() => playTrack(track, selectedPlaylist.tracks)}
                          className="w-8 h-8 rounded-full bg-brand-purple/10 hover:bg-brand-purple text-brand-purple-light hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Tocar"
                        >
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </button>

                        <TrackOptionsMenu
                          track={track}
                          size="sm"
                          onRemoveFromPlaylist={() => handleRemoveTrack(selectedPlaylist.id, track.id, track.title)}
                          onOpenPlaylistPicker={(trackId) => {
                            const found = selectedPlaylist.tracks?.find((t) => t.id === trackId) || globalTracks.find((t) => t.id === trackId) || null;
                            setPickerTrack(found);
                          }}
                        />
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>
      ) : (
        /* ================= MAIN PLAYLISTS EXPLORER ================= */
        <div className="flex flex-col gap-6">
          
          <PageHeader
            title="Playlists & Coleções"
            description="Organização musical da família NeonFlow. Crie álbuns personalizados, navegue por climas (Moods) ou acesse seleções automáticas inteligentes."
            actionSlot={
              <Button onClick={() => setIsCreateModalOpen(true)} variant="primary" glow>
                <Plus className="w-4 h-4" /> Criar Playlist
              </Button>
            }
          />

          {/* ================= FILTERS & TABS BAR ================= */}
          <div className="flex flex-col gap-4 p-5 rounded-3xl bg-brand-card/35 border border-brand-border/50">
            
            {/* Search & Sort Controls */}
            <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch">
              
              <div className="relative flex-1">
                <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar playlists por nome, descrição, tags ou mood..."
                  className="w-full bg-brand-surface border border-brand-border/80 rounded-2xl pl-11 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-brand-purple transition-all placeholder:text-brand-text-muted/60"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-white p-1">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2 bg-brand-surface px-3 py-1.5 rounded-2xl border border-brand-border/80 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-brand-text-muted" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer pr-1"
                >
                  <option value="manual">Fixadas Primeiro (Manual)</option>
                  <option value="alphabetical">Alfabética (A-Z)</option>
                  <option value="recent">Mais Recentes</option>
                  <option value="oldest">Mais Antigas</option>
                  <option value="most-songs">Mais Músicas</option>
                  <option value="fewest-songs">Menos Músicas</option>
                </select>
              </div>

            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-brand-border/30">
              
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5
                  ${activeTab === 'all' ? 'bg-brand-purple text-white shadow-lg' : 'bg-brand-surface border border-brand-border text-brand-text-muted hover:text-white'}
                `}
              >
                <Globe className="w-3.5 h-3.5" /> Todas ({playlists.length})
              </button>

              <button
                onClick={() => setActiveTab('family')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5
                  ${activeTab === 'family' ? 'bg-brand-purple text-white shadow-lg' : 'bg-brand-surface border border-brand-border text-brand-text-muted hover:text-white'}
                `}
              >
                <Users className="w-3.5 h-3.5" /> Família
              </button>

              <button
                onClick={() => setActiveTab('personal')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5
                  ${activeTab === 'personal' ? 'bg-brand-purple text-white shadow-lg' : 'bg-brand-surface border border-brand-border text-brand-text-muted hover:text-white'}
                `}
              >
                <Lock className="w-3.5 h-3.5" /> Pessoais
              </button>

              <button
                onClick={() => setActiveTab('mood')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5
                  ${activeTab === 'mood' ? 'bg-pink-600 text-white shadow-lg' : 'bg-brand-surface border border-brand-border text-brand-text-muted hover:text-white'}
                `}
              >
                <Flame className="w-3.5 h-3.5" /> Moods
              </button>

              <button
                onClick={() => setActiveTab('automatic')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5
                  ${activeTab === 'automatic' ? 'bg-amber-500 text-white shadow-lg' : 'bg-brand-surface border border-brand-border text-brand-text-muted hover:text-white'}
                `}
              >
                <Sparkles className="w-3.5 h-3.5" /> Automáticas
              </button>

              <button
                onClick={() => setActiveTab('favorite')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5
                  ${activeTab === 'favorite' ? 'bg-red-500 text-white shadow-lg' : 'bg-brand-surface border border-brand-border text-brand-text-muted hover:text-white'}
                `}
              >
                <Heart className="w-3.5 h-3.5 fill-current" /> Favoritas
              </button>

              <button
                onClick={() => setActiveTab('pinned')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5
                  ${activeTab === 'pinned' ? 'bg-brand-cyan text-black shadow-lg' : 'bg-brand-surface border border-brand-border text-brand-text-muted hover:text-white'}
                `}
              >
                <Pin className="w-3.5 h-3.5 fill-current" /> Fixadas
              </button>

            </div>

          </div>

          {/* ================= PLAYLISTS CARDS GRID ================= */}
          {playlists.length === 0 ? (
            <EmptyState
              title="Nenhuma playlist criada ainda"
              description="Monte seleções de faixas para a família ouvir no carro, na sala ou em momentos especiais."
              actionLabel="Criar Primeira Playlist"
              onActionClick={() => setIsCreateModalOpen(true)}
            />
          ) : filteredPlaylists.length === 0 ? (
            <EmptyState
              title={searchQuery ? 'Nenhuma playlist encontrada' : 'Nenhuma playlist neste filtro'}
              description={
                searchQuery
                  ? 'Tente buscar por outros termos ou limpe a pesquisa.'
                  : 'Crie uma nova playlist personalizada para esta categoria ou explore outras abas.'
              }
              actionLabel={searchQuery ? 'Limpar Busca' : 'Criar Playlist'}
              onActionClick={
                searchQuery
                  ? () => setSearchQuery('')
                  : () => setIsCreateModalOpen(true)
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPlaylists.map((playlist) => (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  onClick={() => setSelectedPlaylistId(playlist.id)}
                  onEdit={(p) => setEditingPlaylist(p)}
                  onDuplicate={(p) => handleDuplicate(p)}
                  onDelete={(p) => setPlaylistToDelete(p)}
                  onToggleFavorite={(p) => handleToggleFavorite(p)}
                  onTogglePin={(p) => handleTogglePin(p)}
                />
              ))}
            </div>
          )}

        </div>
      )}

      {/* ================= MODALS ================= */}
      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <EditPlaylistModal
        isOpen={Boolean(editingPlaylist)}
        onClose={() => setEditingPlaylist(null)}
        playlist={editingPlaylist}
      />

      {/* Delete Playlist Confirmation Modal */}
      <Modal
        isOpen={Boolean(playlistToDelete)}
        onClose={() => setPlaylistToDelete(null)}
        title="Excluir Playlist"
      >
        <div className="flex flex-col gap-4 text-white">
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <Trash2 className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-bold text-red-300">Atenção! Esta ação é permanente.</h4>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                Tem certeza que deseja excluir esta playlist para toda a família? As músicas continuarão salvas na biblioteca global.
              </p>
            </div>
          </div>

          {playlistToDelete && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-brand-surface/60 border border-brand-border/60">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-brand-surface flex items-center justify-center text-xl shrink-0">
                {playlistToDelete.icon || '🎵'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black truncate">{playlistToDelete.name}</p>
                <p className="text-2xs text-brand-text-muted">
                  {playlistToDelete.tracks?.length || playlistToDelete.songs?.length || 0} músicas
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 mt-2 pt-3 border-t border-brand-border/40">
            <Button
              variant="ghost"
              onClick={() => setPlaylistToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (playlistToDelete) {
                  handleDelete(playlistToDelete);
                  toast.success(`Playlist "${playlistToDelete.name}" excluída com sucesso!`);
                  if (selectedPlaylistId === playlistToDelete.id) {
                    setSelectedPlaylistId(null);
                  }
                  setPlaylistToDelete(null);
                }
              }}
            >
              <Trash2 className="w-4 h-4" /> Confirmar Exclusão
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add To Playlist Picker Modal */}
      <AddToPlaylistModal
        isOpen={Boolean(pickerTrack)}
        onClose={() => setPickerTrack(null)}
        track={pickerTrack}
      />

    </div>
  );
};
