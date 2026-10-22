import React, { useState, useEffect, useCallback } from 'react';
import {
  Music,
  Maximize2,
  ChevronDown,
  Heart,
  ListMusic,
  X,
  Sparkles,
  Mic,
  Loader2,
} from 'lucide-react';
import { usePlayer, useProfile, usePlaylist } from '../../hooks';
import { PlayerControls } from './PlayerControls';
import { ProgressBar } from './ProgressBar';
import { VolumeControl } from './VolumeControl';
import { QueuePanel } from './QueuePanel';
import { YouTubePlayer } from './YouTubePlayer';
import { getSongLyrics, isGeniusApiConfigured } from '../../services/geniusLyricsService';
import { toast } from 'react-hot-toast';

export type PlayerMode = 'compact' | 'expanded';

interface PlayerShellProps {
  mode?: PlayerMode;
  onModeChange?: (mode: PlayerMode) => void;
}

export const PlayerShell: React.FC<PlayerShellProps> = ({
  mode: externalMode,
  onModeChange,
}) => {
  const { currentTrack, isPlaying, queue } = usePlayer();
  const { profiles, activeProfile: activeMember } = useProfile();
  const { toggleFavoriteTrack } = usePlaylist();

  // Internal view mode state if not controlled externally
  const [internalMode, setInternalMode] = useState<PlayerMode>('compact');
  const currentMode = externalMode !== undefined ? externalMode : internalMode;

  const setMode = (newMode: PlayerMode) => {
    if (onModeChange) {
      onModeChange(newMode);
    } else {
      setInternalMode(newMode);
    }
  };

  // Queue panel toggle state
  const [showQueue, setShowQueue] = useState(false);

  // Lyrics panel state
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyricsContent, setLyricsContent] = useState('');
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState('');

  const handleExpand = () => {
    setMode('expanded');
  };

  // Fetch lyrics when lyrics panel is opened or track changes
  const fetchLyrics = useCallback(async () => {
    if (!currentTrack) return;

    // Se as chaves da API não estão configuradas, mostra mensagem amigável
    if (!isGeniusApiConfigured()) {
      setLyricsLoading(false);
      setLyricsContent('');
      setLyricsError('Chaves da API do Genius não configuradas no .env. Adicione VITE_GENIUS_RAPIDAPI_KEY para ativar a busca de letras.');
      return;
    }

    setLyricsLoading(true);
    setLyricsError('');
    setLyricsContent('');

    try {
      const result = await getSongLyrics(currentTrack.title, currentTrack.artist);

      if (result.lyrics && result.lyrics.length > 0) {
        setLyricsContent(result.lyrics);
      } else {
        // Serviço retornou vazio — usa mensagem genérica amigável
        setLyricsError('Letra não encontrada para esta faixa. Verifique se o nome da música está correto.');
      }
    } catch (err) {
      // Captura a mensagem EXATA do serviço (diagnóstico HTTP: 403, 404, 429, etc.)
      const message = err instanceof Error ? err.message : 'Erro desconhecido ao buscar letra.';
      console.error('[PlayerShell] Erro ao buscar letra:', message);
      setLyricsError(message);
    } finally {
      setLyricsLoading(false);
    }
  }, [currentTrack]);

  // Auto-fetch lyrics when panel opens
  useEffect(() => {
    if (showLyrics && currentTrack && !lyricsContent && !lyricsLoading) {
      fetchLyrics();
    }
  }, [showLyrics, currentTrack, lyricsContent, lyricsLoading, fetchLyrics]);

  // Reset lyrics when track changes
  useEffect(() => {
    setLyricsContent('');
    setLyricsError('');
  }, [currentTrack?.id]);

  const toggleLyrics = () => {
    setShowLyrics(!showLyrics);
  };

  if (!currentTrack) {
    return <YouTubePlayer />;
  }

  const contributor = profiles.find((p) => p.id === currentTrack.addedBy);

  const handleToggleFavorite = () => {
    if (currentTrack) {
      toggleFavoriteTrack(currentTrack.id);
      toast.success(
        currentTrack.favorite
          ? 'Removida dos favoritos'
          : 'Adicionada aos favoritos!'
      );
    }
  };

  {/* Play button onClick handler - inline function to avoid syntax issues */}
  const handlePlayPause = () => {
    console.log('Toggle play');
    // Would integrate with player state
  };

  return (
    <div className="select-none">
      {/* Hidden container for engine bridge */}
      <YouTubePlayer />

      {/* COMPACT MODE - Minimal bottom bar */}
      {currentMode === 'compact' && showQueue && (
        <div className="fixed bottom-36 right-3 sm:right-6 md:right-8 z-[65] w-[92vw] max-w-sm sm:w-96 rounded-3xl bg-[#0c0d1a]/95 backdrop-blur-2xl border border-brand-purple/50 shadow-2xl p-3 sm:p-4 animate-in slide-in-from-bottom-6 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
            <h4 className="text-xs font-black uppercase tracking-widest text-brand-purple-light flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-brand-cyan" /> Fila de Reprodução
            </h4>
            <button
              onClick={() => setShowQueue(false)}
              className="p-2 min-w-[40px] min-h-[40px] rounded-xl text-brand-text-muted hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-[380px] overflow-y-auto">
            <QueuePanel />
          </div>
        </div>
      )}

      {/* ================= COMPACT BOTTOM PLAYER BAR ================= */}
      {currentMode === 'compact' && (
        <footer className="fixed bottom-0 left-0 right-0 bg-[color:#0e0e12] backdrop-blur-xl border-t border-border/60 z-[60] shadow-2xl overflow-hidden select-none animate-in slide-in-from-bottom duration-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="max-w-2xl mx-auto px-4">
            {/* Album Art + Play/Pause */}
            <div className="relative flex flex-col items-center gap-3 pt-6 pb-8">
              <button
                onClick={handleExpand}
                className="relative w-44 h-44 min-w-[44px] min-h-[44px] rounded-2xl overflow-hidden shrink-0 bg-gradient-to-br from-brand-card to-brand-surface border border-white/10 shadow-md cursor-pointer group hover:scale-105 active:scale-95 transition-transform"
                title="Expandir Player"
              >
                <img
                  src={
                    currentTrack.thumbnail ||
                    `https://img.youtube.com/vi/${currentTrack.youtubeId}/hqdefault.jpg`
                  }
                  alt={currentTrack.title}
                  className="w-full h-44 sm:h-48 lg:h-56 rounded-2xl object-cover transition-transform group-hover:scale-105 group-hover:brightness-110 transition-transform"
                  referrerPolicy="no-referrer"
                />
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center">
                    <span className="flex gap-1 items-end">
                      <span className="w-0.5 bg-brand-purple-light animate-bounce pulse-1 h-2 rounded-full" style={{ animationDelay: '0.1s' }} />
                      <span className="w-0.5 bg-brand-purple-light animate-bounce pulse-1 h-3 rounded-full" style={{ animationDelay: '0.3s' }} />
                      <span className="w-0.5 bg-brand-purple-light animate-bounce pulse-1 h-1.5 rounded-full" style={{ animationDelay: '0.5s' }} />
                    </span>
                  </div>
                )}
              </button>

              <div className="flex flex-col items-center gap-1.5">
                <p className="text-sm font-extrabold text-white truncate" title={currentTrack.title}>
                  {currentTrack.title}
                </p>
                <p className="text-xs text-brand-text-muted truncate" title={currentTrack.artist}>
                  {currentTrack.artist}
                </p>
              </div>
            </div>

            {/* Progress + Controls */}
            <div className="flex flex-col items-center gap-3 pt-4">
              <ProgressBar />

              <div className="flex items-center justify-between w-full gap-2">
                {/* Fila + Favorito */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-brand-cyan">Fila</span>
                  <span className="relative -top-0.5 -right-0.5 px-1.5 py-0.2 bg-brand-cyan text-black font-black text-[9px] rounded-full shadow-sm">
                    {queue.length}
                  </span>
                </div>

                <button
                  onClick={handleToggleFavorite}
                  className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                    currentTrack.favorite
                      ? 'text-red-400 hover:text-red-300'
                      : 'text-brand-text-muted hover:text-white'
                  }`}
                  title={currentTrack.favorite ? 'Remover dos Favoritos' : 'Favoritar'}
                >
                  <Heart className={`w-4 h-4 ${currentTrack.favorite ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="flex items-center justify-between w-full gap-2">
                <button
                  onClick={() => setShowQueue(!showQueue)}
                  className={`p-2.5 min-w-[44px] min-h-[44px] rounded-xl transition-all cursor-pointer flex items-center justify-center active:scale-90 ${
                    showQueue
                      ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30'
                      : 'text-brand-text-muted hover:text-white hover:bg-white/5'
                  }`}
                  title="Fila de Reprodução"
                >
                  <ListMusic className="w-4 h-4" />
                </button>

                <button
                  onClick={handleExpand}
                  className="p-2.5 min-w-[44px] min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-brand-text-muted hover:text-white transition-colors cursor-pointer flex items-center justify-center active:scale-90"
                  title="Expandir Player"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* ================= EXPANDED FULL-SCREEN NOW-PLAYING (SPOTIFY-STYLE) ================= */}
      {currentMode === 'expanded' && (
        <div className="fixed inset-0 z-[100] bg-[color:#0a0a12] flex flex-col overflow-hidden select-none">
          {/* Top App Bar */}
          <header className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-opacity-30 backdrop-blur-xl shadow-sm flex-shrink-0">
            <div className="flex items-center gap-3">
              <Sparkles className="w-3.5 h-3.5 text-brand-purple-light" />
              <span className="text-xs font-black uppercase tracking-widest text-brand-text-muted">NeonFlow</span>
            </div>
            <button
              onClick={() => setMode('compact')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-extrabold text-brand-text-muted transition-all cursor-pointer active:scale-95"
              title="Minimizar"
            >
              <ChevronDown className="w-4 h-4" /> Minimizar
            </button>
          </header>

          {/* Now Playing Card */}
          <main className="flex-1 flex flex-col items-center py-6">
            {/* Album Art - large animated */}
            <div className="relative w-full max-w-[300px] mx-auto mb-8">
              <button onClick={handleExpand} className="relative" aria-label="Expandir player">
                <img
                  src={
                    currentTrack.thumbnail ||
                    `https://img.youtube.com/vi/${currentTrack.youtubeId}/hqdefault.jpg`
                  }
                  alt={currentTrack.title}
                  className="w-full h-64 sm:h-80 lg:h-96 rounded-2xl object-cover transition-transform hover:scale-105 group-hover:brightness-110 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                {isPlaying && (
                  <div className="absolute bottom-2 right-2 bg-[color:#1e1e24]/80 rounded-2xl p-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-purple-light animate-bounce pulse-1" style={{ animationDelay: '0.1s' }} />
                    <span className="w-2 h-2 rounded-full bg-brand-purple-light animate-bounce pulse-1" style={{ animationDelay: '0.3s' }} />
                    <span>Now Playing</span>
                  </div>
                )}
              </button>

              {/* Gradient overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[color:#0a0a12] via-[color:#1a1a24] to-[color:#0a0a12] opacity-80"></div>
            </div>

            {/* Track Info */}
            <div className="flex flex-col items-center gap-2 w-full max-w-full text-center">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white">
                {currentTrack.title}
              </h1>
              <p className="text-sm text-brand-text-muted">
                {currentTrack.artist}
              </p>
              {currentTrack.album && (
                <p className="text-xs text-brand-text-muted/60">
                  {currentTrack.album}
                </p>
              )}
            </div>

            {/* Progress Bar + Controls */}
            <div className="flex flex-col items-center gap-4 w-full max-w-xl">
              <ProgressBar />

              <div className="flex items-center justify-between w-full">
                {/* Time display */}
                <div className="text-xs text-brand-text-muted">
                  <span>0:00</span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                  {/* Previous button */}
                  <button
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/5 transition-colors cursor-pointer"
                    title="Anterior"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7m5 10l-7 7 7-7"
                      />
                    </svg>
                  </button>

                  {/* Play/Pause - prominent */}
                  <button
                    onClick={handlePlayPause}
                    className="p-3 rounded-full bg-gradient-to-br from-brand-purple to-brand-purple/from-content via-brand-purple/from-content to-brand-purple/from-content bg-opacity-80 backdrop-blur flex items-center justify-center"
                    aria-label="Play/Pause"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {isPlaying ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 12M6 6l12 6m3 0L12 12m3 0l9 9m3-9l9-9"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18 16L6 6m6 10L6 6m6 10l12-6m-6 10l12 6"
                        />
                      )}
                    </svg>
                  </button>

                  {/* Next button */}
                  <button
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/5 transition-colors cursor-pointer"
                    title="Próximo"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Queue button */}
              <button
                onClick={() => setShowQueue(!showQueue)}
                className="w-full sm:w-48 py-3 rounded-xl bg-brand-purple/20 text-brand-purple hover:text-brand-purple/90 font-medium transition-colors cursor-pointer"
                title="Ver Fila"
              >
                <ListMusic className="w-4 h-4 mr-2" />
                Fila de Reprodução ({queue.length > 0 ? queue.length : 0})
              </button>
            </div>
          </main>

          {/* Expanded Queue Drawer */}
          {showQueue && (
            <div className="fixed bottom-0 left-0 right-0 bg-[color:#0e0e12]/90 backdrop-blur-xl border-t border-border/60 z-[50] shadow-2xl p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-font-black uppercase tracking-widest text-brand-purple-light">
                  <ListMusic className="w-4 h-4 text-brand-cyan" /> Fila de Reprodução Atual
                </h4>
                <button
                  onClick={() => setShowQueue(false)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/5 transition-colors cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {queue.map((track, index) => (
                  <div
                    key={track.id || index}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <img
                      src={
                        track.thumbnail ||
                        `https://img.youtube.com/vi/${track.youtubeId}/hqdefault.jpg`
                      }
                      alt={track.title}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" title={track.title}>
                        {track.title}
                      </p>
                      <p className="text-xs text-brand-text-muted/70 truncate" title={track.artist}>
                        {track.artist}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-brand-purple/60">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom mini control when expanded */adge} 
          <footer className="p-4 border-t border-border/60 bg-[color:#0a0a12] backdrop-blur-xl fixed bottom-0 left-0 right-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={
                    currentTrack.thumbnail ||
                    `https://img.youtube.com/vi/${currentTrack.youtubeId}/hqdefault.jpg`
                  }
                  alt={currentTrack.title}
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div>
                  <p className="font-medium text-white truncate" title={currentTrack.title}>
                    {currentTrack.title}
                  </p>
                  <p className="text-xs text-brand-text-muted/70" title={currentTrack.artist}>
                    {currentTrack.artist}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Previous */}
                <button
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/5 transition-colors cursor-pointer"
                  title="Anterior"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7m5 10l-7 7 7-7"
                    />
                  </svg>
                </button>

                {/* Play/Pause */}
                <button
                  onClick={handlePlayPause}
                  className="p-3 rounded-full bg-gradient-to-br from-brand-purple to-brand-purple/from-content via-brand-purple/from-content to-brand-purple/from-content bg-opacity-80 backdrop-blur flex items-center justify-center"
                  aria-label="Play/Pause"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {isPlaying ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 12M6 6l12 6m6 10L6 6m6 10l12-6m-6 10l12 6"
                      )
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 16L6 6m6 10L6 6m6 10l12-6m-6 10l12 6"
                      />
                    )}
                  </svg>
                </button>

                {/* Next */}
                <button
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/5 transition-colors cursor-pointer"
                  title="Próximo"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
};