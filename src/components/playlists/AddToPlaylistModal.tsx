import React, { useState } from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';
import { usePlaylist, useProfile } from '../../hooks';
import { Track } from '../../types';
import { Plus, Check, ListMusic, Lock, Users, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  onClose,
  track,
}) => {
  const { customPlaylists, addTrackToPlaylist, removeTrackFromPlaylist, createPlaylist } = usePlaylist();
  const { activeProfile } = useProfile();

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  if (!track) return null;

  const handleTogglePlaylist = (playlistId: string, playlistName: string, isAlreadyIn: boolean) => {
    if (isAlreadyIn) {
      removeTrackFromPlaylist(playlistId, track.id);
      toast.success(`Música removida da playlist "${playlistName}".`);
    } else {
      addTrackToPlaylist(playlistId, track.id);
      toast.success(`Música adicionada à playlist "${playlistName}"!`);
    }
  };

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) {
      toast.error('Informe o nome da playlist!');
      return;
    }
    if (!activeProfile) return;

    const created = createPlaylist({
      name: newPlaylistName.trim(),
      description: 'Playlist criada rapidamente',
      isFamilyShared: true,
      createdBy: activeProfile.id,
      owner: activeProfile.id,
    });

    addTrackToPlaylist(created.id, track.id);
    toast.success(`Playlist "${newPlaylistName}" criada e música adicionada!`);
    setNewPlaylistName('');
    setIsCreatingNew(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adicionar à Playlist">
      <div className="flex flex-col gap-4">
        
        {/* Track header summary */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-brand-surface border border-brand-border/60">
          <img
            src={track.thumbnail || `https://img.youtube.com/vi/${track.youtubeId}/mqdefault.jpg`}
            alt={track.title}
            className="w-12 h-12 rounded-xl object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
            <p className="text-xs text-brand-text-muted truncate">{track.artist}</p>
          </div>
        </div>

        {/* Playlists list */}
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
          {customPlaylists.length === 0 ? (
            <div className="text-center py-6 text-brand-text-muted text-xs">
              Você ainda não possui playlists personalizadas ativas.
            </div>
          ) : (
            customPlaylists.map((pl) => {
              const songIds = pl.songs || (pl.tracks || []).map((t) => t.id);
              const isAlreadyIn = songIds.includes(track.id);

              return (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => handleTogglePlaylist(pl.id, pl.name, isAlreadyIn)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer text-left
                    ${isAlreadyIn
                      ? 'bg-brand-purple/20 border-brand-purple text-white'
                      : 'bg-brand-card/40 border-brand-border/60 hover:bg-brand-surface/60 hover:border-brand-purple/30'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${pl.coverColor || 'from-indigo-600 to-purple-600'} flex items-center justify-center text-white shrink-0 text-sm`}>
                      {pl.icon || <ListMusic className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{pl.name}</div>
                      <div className="text-[10px] text-brand-text-muted flex items-center gap-1.5">
                        <span>{songIds.length} {songIds.length === 1 ? 'música' : 'músicas'}</span>
                        <span>•</span>
                        <span>{pl.isFamilyShared ? 'Casa 🏠' : 'Privada 🔒'}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all
                    ${isAlreadyIn
                      ? 'bg-brand-purple border-brand-purple text-white'
                      : 'border-brand-border text-transparent hover:border-brand-purple/50'
                    }
                  `}>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Quick create inline form */}
        {isCreatingNew ? (
          <form onSubmit={handleCreateAndAdd} className="flex gap-2 pt-2 border-t border-brand-border/40">
            <input
              type="text"
              placeholder="Nome da nova playlist..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="flex-1 bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-purple"
              autoFocus
            />
            <Button type="submit" variant="primary" size="sm">
              Criar e Adicionar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreatingNew(false)}>
              Cancelar
            </Button>
          </form>
        ) : (
          <div className="pt-2 border-t border-brand-border/40 flex justify-between items-center">
            <button
              onClick={() => setIsCreatingNew(true)}
              className="text-xs font-bold text-brand-purple-light hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> Criar Nova Playlist
            </button>
            <Button onClick={onClose} variant="ghost" size="sm">
              Concluído
            </Button>
          </div>
        )}

      </div>
    </Modal>
  );
};
