import React, { useState, useRef, useEffect } from 'react';
import {
  ListMusic,
  Play,
  Heart,
  Pin,
  MoreVertical,
  Edit2,
  Copy,
  Trash2,
  Share2,
  Clock,
  Sparkles,
  Users,
  Lock,
  Flame,
  Radio
} from 'lucide-react';
import { Playlist } from '../../types';
import { usePlaylist, usePlayer, useProfile } from '../../hooks';
import { getPlaylistMosaicThumbnails } from '../../utils/playlistHelpers';
import { toast } from 'react-hot-toast';

interface PlaylistCardProps {
  playlist: Playlist;
  onClick: () => void;
  onEdit?: (playlist: Playlist) => void;
  onDuplicate?: (playlist: Playlist) => void;
  onDelete?: (playlist: Playlist) => void;
  onToggleFavorite?: (playlist: Playlist) => void;
  onTogglePin?: (playlist: Playlist) => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  onClick,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  onTogglePin,
}) => {
  const { globalTracks } = usePlaylist();
  const { playTrack } = usePlayer();
  const { profiles } = useProfile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trackCount = playlist.tracks?.length || playlist.songs?.length || 0;
  const isCustom = playlist.type !== 'automatic' && playlist.type !== 'mood';

  // Get thumbnails for 2x2 mosaic
  const mosaicThumbs = getPlaylistMosaicThumbnails(playlist, globalTracks);

  const ownerProfile = profiles.find((p) => p.id === (playlist.owner || playlist.createdBy));

  const handlePlayAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!playlist.tracks || playlist.tracks.length === 0) {
      toast.error('Essa playlist não possui músicas cadastradas!');
      return;
    }
    playTrack(playlist.tracks[0], playlist.tracks);
    toast.success(`Tocando "${playlist.name}"!`);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link da playlist copiado para a área de transferência!');
    } else {
      toast.success(`Compartilhando "${playlist.name}" com a casa!`);
    }
  };

  // Format last played date
  const formatLastPlayed = (isoDate?: string) => {
    if (!isoDate) return null;
    try {
      const date = new Date(isoDate);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return null;
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl bg-brand-card/40 border transition-all duration-300 hover:scale-[1.02] cursor-pointer flex flex-col justify-between overflow-hidden
        ${playlist.pinned
          ? 'border-brand-purple/50 bg-brand-purple/10 shadow-[0_0_20px_rgba(123,44,191,0.08)]'
          : 'border-brand-border/60 hover:border-brand-purple/30 hover:bg-brand-surface/40 hover:shadow-xl'
        }
      `}
    >
      {/* ================= COVER AREA ================= */}
      <div className="relative h-44 w-full overflow-hidden bg-brand-surface flex items-center justify-center">
        
        {/* Cover Type Render */}
        {playlist.coverType === 'image' && playlist.cover && playlist.cover.startsWith('http') ? (
          <img
            src={playlist.cover}
            alt={playlist.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        ) : mosaicThumbs.length >= 4 ? (
          /* 2x2 Mosaic Layout (Spotify Style for 4+ tracks) */
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5 bg-brand-bg group-hover:scale-105 transition-transform duration-500">
            {mosaicThumbs.slice(0, 4).map((thumb, i) => (
              <div key={i} className="w-full h-full overflow-hidden bg-brand-surface relative">
                <img
                  src={thumb}
                  alt="cover thumb"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>
        ) : (
          /* Gradient / Fallback Cover for < 4 tracks or standard playlists */
          <div
            className={`w-full h-full bg-gradient-to-br ${playlist.coverColor || 'from-indigo-600 to-purple-600'} flex flex-col items-center justify-center text-white relative group-hover:scale-105 transition-transform duration-500`}
            style={playlist.coverType === 'solid' && playlist.cover ? { backgroundColor: playlist.cover } : {}}
          >
            <span className="text-4xl drop-shadow-md select-none flex items-center justify-center">
              {playlist.icon || '🎵'}
            </span>
          </div>
        )}

        {/* Backdrop vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-card via-transparent to-black/30" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Type badge */}
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-md border border-white/10 text-white shadow-md flex items-center gap-1
              ${playlist.type === 'automatic' ? 'bg-amber-500/80' : playlist.type === 'mood' ? 'bg-pink-600/80' : playlist.isFamilyShared ? 'bg-brand-purple/80' : 'bg-zinc-800/80'}
            `}>
              {playlist.type === 'automatic' && <Sparkles className="w-2.5 h-2.5" />}
              {playlist.type === 'mood' && <Flame className="w-2.5 h-2.5" />}
              {playlist.type === 'family' && <Users className="w-2.5 h-2.5" />}
              {playlist.type === 'personal' && <Lock className="w-2.5 h-2.5" />}
              {playlist.type === 'automatic'
                ? 'Auto'
                : playlist.type === 'mood'
                ? 'Mood'
                : playlist.isFamilyShared
                ? 'Família'
                : 'Pessoal'}
            </span>

            {/* Mood label if present */}
            {playlist.mood && (
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-brand-pink">
                {playlist.mood}
              </span>
            )}
          </div>

          {/* Pin Indicator */}
          {playlist.pinned && (
            <span className="p-1 rounded-full bg-brand-purple text-white shadow-lg border border-white/20">
              <Pin className="w-3 h-3 fill-current" />
            </span>
          )}
        </div>

        {/* Quick Play Trigger Overlay */}
        <button
          onClick={handlePlayAll}
          disabled={trackCount === 0}
          className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-brand-purple-light hover:bg-brand-cyan text-white hover:text-black flex items-center justify-center shadow-2xl transform translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer disabled:opacity-0 pointer-events-auto"
          title="Tocar tudo"
        >
          <Play className="w-5 h-5 fill-current ml-0.5" />
        </button>

      </div>

      {/* ================= CARD DETAILS ================= */}
      <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-extrabold text-white truncate leading-snug group-hover:text-brand-purple-light transition-colors flex items-center gap-1.5">
              {playlist.icon && playlist.coverType !== 'solid' && playlist.coverType !== 'gradient' && (
                <span className="text-xs">{playlist.icon}</span>
              )}
              <span className="truncate">{playlist.name}</span>
            </h3>

            {/* Favorite heart button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite?.(playlist);
              }}
              className={`p-1 rounded-full text-brand-text-muted hover:text-red-400 transition-colors cursor-pointer shrink-0
                ${playlist.favorite ? 'text-red-500 fill-red-500' : ''}
              `}
              title={playlist.favorite ? 'Desfavoritar' : 'Favoritar'}
            >
              <Heart className={`w-4 h-4 ${playlist.favorite ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          </div>

          <p className="text-xs text-brand-text-muted/80 line-clamp-2 mt-1 leading-relaxed font-medium">
            {playlist.description || 'Playlist sem descrição.'}
          </p>
        </div>

        {/* Tags row */}
        {playlist.tags && playlist.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {playlist.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-brand-text-muted"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer info & Quick Action Menu */}
        <div className="border-t border-brand-border/40 pt-2.5 mt-2 flex items-center justify-between text-3xs font-extrabold uppercase tracking-wider text-brand-text-muted">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">{trackCount} {trackCount === 1 ? 'música' : 'músicas'}</span>
            {formatLastPlayed(playlist.lastPlayed) && (
              <span className="flex items-center gap-1 text-brand-text-muted/60">
                <Clock className="w-2.5 h-2.5" /> {formatLastPlayed(playlist.lastPlayed)}
              </span>
            )}
          </div>

          {/* Quick Action Context Menu */}
          <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 rounded-lg hover:bg-white/10 text-brand-text-muted hover:text-white transition-colors cursor-pointer"
              title="Ações rápidas"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Menu Popup */}
            {isMenuOpen && (
              <div className="absolute right-0 bottom-7 z-50 w-44 rounded-xl bg-[#141622] border border-brand-purple/30 shadow-2xl p-1.5 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150 select-none">
                <button
                  onClick={handlePlayAll}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white hover:bg-brand-purple/20 transition-colors text-left cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-brand-purple-light" /> Tocar
                </button>

                {isCustom && onEdit && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEdit(playlist);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-brand-text hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Editar
                  </button>
                )}

                {onDuplicate && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDuplicate(playlist);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-brand-text hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Duplicar
                  </button>
                )}

                {onTogglePin && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onTogglePin(playlist);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-brand-text hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer"
                  >
                    <Pin className="w-3.5 h-3.5" /> {playlist.pinned ? 'Desfixar' : 'Fixar no Topo'}
                  </button>
                )}

                {onToggleFavorite && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onToggleFavorite(playlist);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-brand-text hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 text-red-400" /> {playlist.favorite ? 'Desfavoritar' : 'Favoritar'}
                  </button>
                )}

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-brand-text hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-brand-cyan" /> Compartilhar
                </button>

                {isCustom && onDelete && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDelete(playlist);
                    }}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer border-t border-brand-border/40 mt-1 pt-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
