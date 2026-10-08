import React from 'react';
import { Play, Trash2, Music, Trash, Disc, Sparkles } from 'lucide-react';
import { usePlayer } from '../../hooks';
import { Track } from '../../types';
import { toast } from 'react-hot-toast';

export const QueuePanel: React.FC = () => {
  const { queue, currentTrack, playTrack, removeFromQueue, clearQueue, isPlaying } = usePlayer();

  const handleClearQueue = () => {
    clearQueue();
    toast.success('Fila de reprodução limpa com sucesso!');
  };

  const handleRemoveTrack = (trackId: string, trackTitle: string) => {
    removeFromQueue(trackId);
    toast.success(`"${trackTitle}" removida da fila`);
  };

  const handlePlayQueueItem = (track: Track) => {
    playTrack(track, queue);
  };

  const formatSeconds = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col gap-3 bg-brand-card/40 border border-brand-border/60 p-4 sm:p-5 rounded-3xl h-full justify-between select-none backdrop-blur-xl">
      <div className="flex flex-col gap-3 flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-brand-border/40">
          <div className="text-xs font-extrabold uppercase tracking-widest text-brand-purple-light flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-cyan" />
            <span>Fila de Reprodução ({queue.length})</span>
          </div>
          {queue.length > 0 && (
            <button
              onClick={handleClearQueue}
              className="text-xs font-bold text-red-400 hover:text-red-300 transition-all cursor-pointer flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20"
            >
              <Trash className="w-3.5 h-3.5" />
              <span>Limpar Fila</span>
            </button>
          )}
        </div>

        {/* Current Track Section */}
        {currentTrack && (
          <div className="flex flex-col gap-1.5 bg-brand-purple/15 border border-brand-purple/40 p-3 rounded-2xl">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-purple-light flex items-center gap-1.5">
              <Disc className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin text-brand-cyan' : ''}`} />
              Tocando Agora
            </span>
            <div className="flex items-center gap-3">
              <img
                src={currentTrack.thumbnail || `https://img.youtube.com/vi/${currentTrack.youtubeId}/default.jpg`}
                alt={currentTrack.title}
                className="w-10 h-10 object-cover rounded-xl shrink-0 border border-white/10"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-white truncate leading-tight">
                  {currentTrack.title}
                </h4>
                <p className="text-2xs text-brand-text-muted truncate mt-0.5 font-medium">
                  {currentTrack.artist}
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-brand-purple-light shrink-0">
                {formatSeconds(currentTrack.duration || 210)}
              </span>
            </div>
          </div>
        )}

        {/* Upcoming Queue Section "A Seguir" */}
        <div className="flex flex-col gap-2 flex-1 overflow-hidden">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-brand-text-muted flex items-center gap-1 pt-1">
            <Music className="w-3.5 h-3.5 text-brand-cyan" />
            <span>A Seguir</span>
          </div>

          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-6 bg-brand-surface/30 rounded-2xl border border-brand-border/40 my-auto">
              <Music className="w-8 h-8 text-brand-text-muted/40 mb-2" />
              <p className="text-xs font-black text-brand-text-muted">Fila Vazia</p>
              <p className="text-3xs text-brand-text-muted/60 mt-1 max-w-[200px]">
                Adicione faixas clicando no menu de 3 pontinhos nas músicas ou no botão "Adicionar à Fila".
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[320px] pr-1 scrollbar-thin scrollbar-thumb-brand-border/60">
              {queue.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id;
                const durationStr = formatSeconds(track.duration || 210);

                return (
                  <div
                    key={`${track.id}-${idx}`}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all duration-200 group ${
                      isCurrent
                        ? 'bg-brand-purple/20 border-brand-purple/50 shadow-md'
                        : 'bg-brand-surface/40 border-brand-border/60 hover:bg-brand-surface/80 hover:border-brand-purple/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-5 text-center text-3xs font-extrabold text-brand-text-muted/80 shrink-0">
                        {isCurrent && isPlaying ? (
                          <span className="flex gap-0.5 items-end justify-center h-2.5">
                            <span className="w-0.5 bg-brand-cyan h-1.5 rounded-full animate-bounce" />
                            <span className="w-0.5 bg-brand-cyan h-2.5 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                            <span className="w-0.5 bg-brand-cyan h-1 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                          </span>
                        ) : (
                          <span>#{idx + 1}</span>
                        )}
                      </div>

                      <img
                        src={track.thumbnail || `https://img.youtube.com/vi/${track.youtubeId}/default.jpg`}
                        alt={track.title}
                        className="w-9 h-9 object-cover rounded-xl shrink-0 border border-brand-border/40"
                        referrerPolicy="no-referrer"
                      />

                      <div className="min-w-0 flex-1">
                        <h4 className={`text-xs font-extrabold truncate leading-tight ${isCurrent ? 'text-brand-purple-light' : 'text-white'}`}>
                          {track.title}
                        </h4>
                        <p className="text-2xs text-brand-text-muted truncate mt-0.5">{track.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pl-2">
                      <span className="text-2xs font-mono text-brand-text-muted/90 font-bold">{durationStr}</span>

                      {!isCurrent && (
                        <button
                          onClick={() => handlePlayQueueItem(track)}
                          className="p-1.5 text-brand-text-muted hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                          title="Tocar Agora"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}

                      <button
                        onClick={() => handleRemoveTrack(track.id, track.title)}
                        className="p-1.5 text-brand-text-muted hover:text-red-400 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        title="Remover da Fila"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
