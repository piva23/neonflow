import React, { useState, useEffect, useCallback } from 'react';
import {
  Music,
  Maximize2,
  ChevronDown,
  Heart,
  ListMusic,
  X,
  Sparkles,
  Disc,
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

  // Gamification data for active member
  const handleToggleFavorite = () => {
    if (currentTrack) {
      toggleFavoriteTrack(currentTrack.id);
      toast.success(
        currentTrack.favorite
          ? `Removida dos favoritos`
          : `Adicionada aos favoritos!`
      );
    }
  };

  return (
    <div className="select-none">
      {/* Hidden container for engine bridge */}
      <YouTubePlayer />

      {/* COMPACT MODE QUEUE FLOATING PANEL / DRAWER */}
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

      {/* ================= COMPACT BOTTOM PERMANENT PLAYER BAR ================= */}
      {currentMode === 'compact' && (
        <footer className="fixed bottom-0 left-0 right-0 bg-brand-surface/95 backdrop-blur-xl border-t border-brand-border/60 z-[60] shadow-2xl overflow-hidden select-none animate-in slide-in-from-bottom duration-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {/* Progress bar at top of player */}
          <div className="px-3 sm:px-4 pt-1">
            <ProgressBar />
          </div>

          <div className="h-20 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3">
            {/* Left: Capa (48px) + Título + Artista */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 w-2/5 sm:w-1/3 md:w-1/4">
              <button
                onClick={handleExpand}
                className="relative w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl overflow-hidden shrink-0 bg-brand-card border border-white/10 shadow-md cursor-pointer group hover:scale-105 active:scale-95 transition-transform"
                title="Expandir Player"
              >
                <img
                  src={
                    currentTrack.thumbnail ||
                    `https://img.youtube.com/vi/${currentTrack.youtubeId}/mqdefault.jpg`
                  }
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="flex gap-0.5 items-end h-3">
                      <span className="w-0.5 bg-brand-purple-light animate-bounce h-2 rounded-full" style={{ animationDelay: '0.1s' }} />
                      <span className="w-0.5 bg-brand-purple-light animate-bounce h-3 rounded-full" style={{ animationDelay: '0.3s' }} />
                      <span className="w-0.5 bg-brand-purple-light animate-bounce h-1.5 rounded-full" style={{ animationDelay: '0.5s' }} />
                    </span>
                  </div>
                )}
              </button>

              <div className="min-w-0 flex flex-col justify-center">
                <button
                  onClick={handleExpand}
                  className="text-xs md:text-sm font-extrabold text-white truncate leading-tight cursor-pointer hover:text-brand-purple-light transition-colors text-left flex items-center gap-1.5"
                  title={currentTrack.title}
                >
                  {currentTrack.source?.type === 'local' && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black">
                      OFFLINE
                    </span>
                  )}
                  <span className="truncate">{currentTrack.title}</span>
                </button>
                <p className="text-[10px] sm:text-2xs text-brand-text-muted truncate leading-tight mt-0.5">
                  {currentTrack.artist}
                </p>
              </div>

              <button
                onClick={handleToggleFavorite}
                className={`p-2 min-w-[40px] min-h-[40px] rounded-xl transition-colors cursor-pointer shrink-0 hidden sm:flex items-center justify-center active:scale-90 ${
                  currentTrack.favorite
                    ? 'text-red-500 hover:text-red-400'
                    : 'text-brand-text-muted hover:text-white'
                }`}
                title={currentTrack.favorite ? 'Remover dos Favoritos' : 'Favoritar'}
              >
                <Heart className={`w-4 h-4 ${currentTrack.favorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Center: Controles Principais */}
            <div className="flex items-center justify-center flex-1 max-w-md">
              <PlayerControls size="sm" />
            </div>

            {/* Right: Fila + Expandir */}
            <div className="flex items-center justify-end gap-1 sm:gap-1.5 w-auto">
              <button
                onClick={() => setShowQueue(!showQueue)}
                className={`relative p-2 min-w-[40px] min-h-[40px] rounded-xl transition-all cursor-pointer flex items-center justify-center active:scale-90 ${
                  showQueue
                    ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30'
                    : 'text-brand-text-muted hover:text-white hover:bg-white/5'
                }`}
                title="Fila de Reprodução"
              >
                <ListMusic className="w-4 h-4" />
                {queue.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 px-1.5 py-0.2 bg-brand-cyan text-black font-black text-[9px] rounded-full shadow-sm">
                    {queue.length}
                  </span>
                )}
              </button>

              <button
                onClick={handleExpand}
                className="p-2 min-w-[44px] min-h-[44px] rounded-xl bg-white/5 border border-white/10 text-brand-text-muted hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center active:scale-90"
                title="Expandir Player"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* ================= EXPANDED FULL-SCREEN OVERLAY (WINAMP MODERNO) ================= */}
      {currentMode === 'expanded' && (
        <div className="fixed inset-0 z-[70] bg-gradient-to-b from-[#080911] via-[#0a0b15] to-[#0c0d1a] text-white flex flex-col animate-in fade-in duration-300 overflow-hidden select-none">
          {/* Top Header */}
          <div className="flex items-center justify-between shrink-0 px-4 sm:px-6 pt-4 pb-2 z-10">
            <button
              onClick={() => setMode('compact')}
              className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-extrabold text-brand-text-muted hover:text-white transition-all cursor-pointer active:scale-95"
            >
              <ChevronDown className="w-4 h-4 text-brand-purple-light" /> <span className="hidden sm:inline">Minimizar</span>
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-purple-light" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-brand-text-muted">
                NeonFlow
              </span>
            </div>

            <button
              onClick={() => setShowQueue(!showQueue)}
              className={`flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-2xl border text-xs font-extrabold transition-all cursor-pointer active:scale-95 ${
                showQueue
                  ? 'bg-brand-cyan text-black border-brand-cyan shadow-lg shadow-brand-cyan/20'
                  : 'bg-white/5 border-white/10 text-brand-text-muted hover:text-white'
              }`}
            >
              <ListMusic className="w-4 h-4" /> <span className="hidden sm:inline">Fila</span>
              {queue.length > 0 && (
                <span className="px-1.5 py-0.2 bg-white/20 rounded-full text-[9px] font-black">
                  {queue.length}
                </span>
              )}
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4">
            {/* Central Area: Disco Neon Girando OU Letra da Música */}
            <div className="flex flex-col items-center gap-6 py-4 sm:py-6">

              {/* ===== LYRICS PANEL (quando ativo) ===== */}
              {showLyrics ? (
                <div className="w-full max-w-2xl animate-in fade-in duration-300">
                  {/* Lyrics Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-brand-purple-light" />
                      <span className="text-xs font-black uppercase tracking-widest text-brand-purple-light">
                        Letra da Música
                      </span>
                    </div>
                    <button
                      onClick={() => setShowLyrics(false)}
                      className="p-2 min-w-[40px] min-h-[40px] rounded-xl bg-white/5 border border-white/10 text-brand-text-muted hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center active:scale-90"
                      title="Fechar Letra"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Lyrics Content Container */}
                  <div className="relative rounded-3xl bg-gradient-to-b from-brand-surface/80 to-brand-card/60 backdrop-blur-xl border border-brand-purple/20 shadow-2xl overflow-hidden">
                    {/* Decorative top glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-brand-purple/10 blur-3xl pointer-events-none" />

                    {/* Lyrics Body */}
                    <div className="relative p-5 sm:p-6 max-h-[50vh] sm:max-h-[55vh] overflow-y-auto">
                      {/* Loading State */}
                      {lyricsLoading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                          <div className="relative">
                            <Loader2 className="w-10 h-10 text-brand-purple-light animate-spin" />
                            <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-brand-purple/20" />
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-sm font-bold text-brand-text">
                              Buscando letra...
                            </span>
                            <span className="text-xs text-brand-text-muted">
                              Genius API v3
                            </span>
                          </div>
                          {/* Animated dots */}
                          <div className="flex gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-brand-purple animate-bounce" style={{ animationDelay: '0s' }} />
                            <span className="w-2 h-2 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '0.15s' }} />
                            <span className="w-2 h-2 rounded-full bg-brand-pink animate-bounce" style={{ animationDelay: '0.3s' }} />
                          </div>
                        </div>
                      )}

                      {/* Error State — Mensagem exata do diagnóstico, em destaque */}
                      {!lyricsLoading && lyricsError && (
                        <div className="flex flex-col items-center justify-center py-10 gap-4">
                          {/* Ícone de erro com glow vermelho */}
                          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/10">
                            <Music className="w-6 h-6 text-red-400" />
                          </div>

                          {/* Mensagem de erro — estilo glassmorphism vermelho */}
                          <div className="w-full max-w-sm rounded-2xl bg-red-500/8 border border-red-500/25 p-4 text-center">
                            <span className="text-sm font-bold text-red-400 block mb-2">
                              Diagnóstico do Erro
                            </span>
                            <span className="text-xs text-red-300/90 leading-relaxed block font-medium">
                              {lyricsError}
                            </span>
                          </div>

                          <button
                            onClick={fetchLyrics}
                            className="px-5 py-2.5 min-h-[44px] rounded-xl bg-brand-purple/20 hover:bg-brand-purple/40 border border-brand-purple/40 text-brand-purple-light text-xs font-bold transition-all cursor-pointer active:scale-95"
                          >
                            Tentar Novamente
                          </button>
                        </div>
                      )}

                      {/* Lyrics Text */}
                      {!lyricsLoading && !lyricsError && lyricsContent && (
                        <div className="whitespace-pre-line text-base sm:text-lg md:text-xl font-semibold leading-relaxed text-white/90 select-text">
                          {lyricsContent}
                        </div>
                      )}

                      {/* Empty state (panel opened but no fetch yet) */}
                      {!lyricsLoading && !lyricsError && !lyricsContent && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                          <Mic className="w-8 h-8 text-brand-text-muted/50" />
                          <span className="text-xs text-brand-text-muted">
                            Carregando letra...
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom fade gradient */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-brand-surface/90 to-transparent pointer-events-none" />
                  </div>
                </div>
              ) : (

              /* ===== DISCO GIRANDO (quando letra está desativada) ===== */
              <>
              <div className="relative w-52 h-52 sm:w-64 sm:h-64 lg:w-80 lg:h-80 rounded-full bg-gradient-to-br from-brand-surface to-brand-card border-4 border-brand-purple/20 shadow-2xl flex items-center justify-center shrink-0">
                {/* Outer ring glow */}
                <div className="absolute inset-0 rounded-full border border-brand-purple/10" />
                <div className="absolute inset-3 rounded-full border border-white/5" />
                <div className="absolute inset-6 rounded-full border border-brand-purple/5" />

                {/* Spinning disc */}
                <div
                  className={`w-40 h-40 sm:w-52 sm:h-52 lg:w-64 lg:h-64 rounded-full overflow-hidden border-4 border-black/80 shadow-2xl relative ${
                    isPlaying ? 'animate-spin' : ''
                  }`}
                  style={{ animationDuration: '10s' }}
                >
                  <img
                    src={
                      currentTrack.thumbnail ||
                      `https://img.youtube.com/vi/${currentTrack.youtubeId}/hqdefault.jpg`
                    }
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {/* Center hole */}
                  <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-black border-2 border-white/30 shadow-inner flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-brand-cyan shadow-lg shadow-brand-cyan/50" />
                  </div>
                </div>

                {/* Badge */}
                <div className="absolute bottom-2 sm:bottom-3 px-3 py-1 rounded-full bg-black/80 border border-brand-purple/40 backdrop-blur-md text-[9px] sm:text-[10px] font-black uppercase text-brand-purple-light tracking-widest flex items-center gap-1.5">
                  <Disc className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isPlaying ? 'animate-spin' : ''}`} />
                  <span>Audio Only</span>
                </div>
              </div>
              </>
              )}

              {/* Track Info */}
              <div className="flex flex-col gap-3 max-w-lg w-full text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[10px] sm:text-3xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-brand-purple/20 text-brand-purple-light border border-brand-purple/30">
                    {currentTrack.genre || 'Geral'}
                  </span>
                  {currentTrack.source?.type === 'local' && (
                    <span className="text-[10px] sm:text-3xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      OFFLINE
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-display tracking-tight text-white leading-snug px-2">
                  {currentTrack.title}
                </h2>

                <p className="text-xs sm:text-sm text-brand-text-muted font-bold">
                  {currentTrack.artist} {currentTrack.album ? `• ${currentTrack.album}` : ''}
                </p>

                {contributor && (
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <span className="text-[10px] sm:text-xs text-brand-text-muted">Adicionada por:</span>
                    <span
                      className="text-[10px] sm:text-xs font-black uppercase px-2.5 py-0.5 rounded-full border"
                      style={{
                        color: contributor.color,
                        borderColor: `${contributor.color}40`,
                        backgroundColor: `${contributor.color}15`,
                      }}
                    >
                      {contributor.name} {contributor.avatar}
                    </span>
                  </div>
                )}

                <button
                  onClick={handleToggleFavorite}
                  className={`self-center mt-2 px-4 py-2.5 min-h-[44px] rounded-2xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-bold active:scale-95 ${
                    currentTrack.favorite
                      ? 'bg-red-500/20 border-red-500 text-red-400'
                      : 'bg-white/5 border-white/10 text-brand-text-muted hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${currentTrack.favorite ? 'fill-current' : ''}`} />
                  <span>{currentTrack.favorite ? 'Favoritada' : 'Favoritar'}</span>
                </button>
              </div>
            </div>

            {/* Expanded Queue Drawer */}
            {showQueue && (
              <div className="p-4 rounded-3xl bg-brand-surface/95 border border-brand-border my-4 max-h-60 overflow-y-auto z-10">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-brand-purple-light flex items-center gap-2">
                    <ListMusic className="w-4 h-4 text-brand-cyan" /> Fila de Reprodução Atual
                  </h4>
                  <button
                    onClick={() => setShowQueue(false)}
                    className="p-2 min-w-[40px] min-h-[40px] rounded-xl text-brand-text-muted hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <QueuePanel />
              </div>
            )}
          </div>

          {/* Expanded Bottom Controls - Fixed at bottom */}
          <div className="shrink-0 px-4 sm:px-6 pb-4 pt-2 bg-gradient-to-t from-[#0c0d1a] via-[#0c0d1a]/95 to-transparent z-10" style={{ paddingBottom: 'max(1rem, calc(1rem + env(safe-area-inset-bottom)))' }}>
            {/* Progress Bar */}
            <div className="mb-3">
              <ProgressBar />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              {/* Lyrics Button — SEMPRE VISÍVEL no fullscreen */}
              <button
                onClick={toggleLyrics}
                className={`w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl transition-all cursor-pointer flex items-center justify-center active:scale-90 ${
                  showLyrics
                    ? 'bg-brand-purple/40 text-brand-purple-light border-2 border-brand-purple/60 shadow-lg shadow-brand-purple/30'
                    : 'bg-white/10 hover:bg-white/15 text-brand-text-muted hover:text-white border border-white/15 hover:border-white/25'
                }`}
                title={showLyrics ? 'Fechar Letra' : 'Ver Letra'}
              >
                <Mic className="w-5 h-5" />
              </button>

              <div className="hidden sm:block">
                <VolumeControl />
              </div>
              <div className="flex-1 flex justify-center">
                <PlayerControls size="lg" />
              </div>
              <button
                onClick={() => setMode('compact')}
                className="p-2.5 min-w-[44px] min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-brand-text-muted hover:text-white transition-colors cursor-pointer flex items-center justify-center active:scale-90"
                title="Minimizar"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

