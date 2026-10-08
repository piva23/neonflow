import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  ListPlus,
  ArrowRightCircle,
  Heart,
  PlusCircle,
  Download,
  Edit2,
  Trash2,
  Music,
  ListX,
  Check,
} from 'lucide-react';
import { usePlayer, usePlaylist } from '../../hooks';
import { Track } from '../../types';
import { toast } from 'react-hot-toast';

interface TrackOptionsMenuProps {
  track: Track;
  onOpenPlaylistPicker?: (trackId: string) => void;
  onEdit?: (track: Track) => void;
  onDelete?: (trackId: string, trackTitle: string) => void;
  onDownload?: (track: Track) => void;
  onRemoveFromPlaylist?: (trackId: string, trackTitle: string) => void;
  buttonClassName?: string;
  size?: 'sm' | 'md';
}

export const TrackOptionsMenu: React.FC<TrackOptionsMenuProps> = ({
  track,
  onOpenPlaylistPicker,
  onEdit,
  onDelete,
  onDownload,
  onRemoveFromPlaylist,
  buttonClassName = '',
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { addToQueue, addNextToQueue } = usePlayer();
  const { toggleFavoriteTrack } = usePlaylist();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(track);
    toast.success(`Música adicionada à fila`, {
      icon: '🎵',
      style: {
        borderRadius: '16px',
        background: '#121324',
        color: '#fff',
        border: '1px solid rgba(131, 56, 236, 0.4)',
      },
    });
    setIsOpen(false);
  };

  const handlePlayNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    addNextToQueue(track);
    toast.success(`Música definida para tocar a seguir`, {
      icon: '⏭️',
      style: {
        borderRadius: '16px',
        background: '#121324',
        color: '#fff',
        border: '1px solid rgba(0, 245, 212, 0.4)',
      },
    });
    setIsOpen(false);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteTrack(track.id);
    toast.success(
      track.favorite
        ? `Removida dos favoritos`
        : `Adicionada aos favoritos!`,
      {
        icon: track.favorite ? '💔' : '❤️',
      }
    );
    setIsOpen(false);
  };

  const handlePlaylistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onOpenPlaylistPicker) {
      onOpenPlaylistPicker(track.id);
    }
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onDownload) {
      onDownload(track);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onEdit) {
      onEdit(track);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onDelete) {
      onDelete(track.id, track.title);
    }
  };

  const handleRemoveFromPlaylistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onRemoveFromPlaylist) {
      onRemoveFromPlaylist(track.id, track.title);
    }
  };

  const btnSizes = size === 'sm' ? 'p-1' : 'p-1.5';
  const iconSizes = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`rounded-xl text-brand-text-muted hover:text-white hover:bg-white/10 transition-colors cursor-pointer ${btnSizes} ${buttonClassName}`}
        title="Opções da Música"
      >
        <MoreVertical className={iconSizes} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0e0f1d] border border-brand-purple/40 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
          <div className="px-2.5 py-1.5 border-b border-white/10 mb-1">
            <p className="text-2xs font-bold text-white truncate">{track.title}</p>
            <p className="text-[9px] text-brand-text-muted truncate">{track.artist}</p>
          </div>

          <button
            onClick={handleAddToQueue}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-bold text-white hover:bg-brand-purple/20 hover:text-brand-purple-light rounded-xl transition-all text-left cursor-pointer"
          >
            <ListPlus className="w-4 h-4 text-brand-cyan" />
            <span>Adicionar à Fila</span>
          </button>

          <button
            onClick={handlePlayNext}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-bold text-white hover:bg-brand-purple/20 hover:text-brand-cyan rounded-xl transition-all text-left cursor-pointer"
          >
            <ArrowRightCircle className="w-4 h-4 text-brand-purple-light" />
            <span>Tocar a Seguir</span>
          </button>

          <button
            onClick={handleToggleFavorite}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-bold text-white hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all text-left cursor-pointer"
          >
            <Heart className={`w-4 h-4 ${track.favorite ? 'fill-red-500 text-red-500' : 'text-brand-text-muted'}`} />
            <span>{track.favorite ? 'Remover Favorito' : 'Favoritar'}</span>
          </button>

          {onOpenPlaylistPicker && (
            <button
              onClick={handlePlaylistClick}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-bold text-white hover:bg-brand-purple/20 hover:text-brand-purple-light rounded-xl transition-all text-left cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-brand-pink" />
              <span>Adicionar à Playlist</span>
            </button>
          )}

          {onDownload && (
            track.source?.type === 'local' ? (
              <div className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 rounded-xl select-none">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Disponível Offline</span>
              </div>
            ) : (
              <button
                onClick={handleDownloadClick}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-bold text-white hover:bg-emerald-500/20 hover:text-emerald-400 rounded-xl transition-all text-left cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Baixar Offline</span>
              </button>
            )
          )}

          {onEdit && (
            <button
              onClick={handleEditClick}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-xl transition-all text-left cursor-pointer"
            >
              <Edit2 className="w-4 h-4 text-amber-400" />
              <span>Editar Metadados</span>
            </button>
          )}

          {onRemoveFromPlaylist && (
            <button
              onClick={handleRemoveFromPlaylistClick}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/20 rounded-xl transition-all text-left cursor-pointer"
            >
              <ListX className="w-4 h-4 text-amber-400" />
              <span>Remover desta Playlist</span>
            </button>
          )}

          {onDelete && (
            <div className="border-t border-white/10 mt-1 pt-1">
              <button
                onClick={handleDeleteClick}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 rounded-xl transition-all text-left cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Excluir Música</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
