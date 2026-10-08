import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Download, Check, Sparkles, Youtube, Music2, RefreshCw, AlertCircle } from 'lucide-react';
import { searchYouTube, YouTubeSearchResult } from '../services/youtubeSearchService';
import { useProfile, usePlaylist } from '../hooks';
import { downloadManager } from '../core/download';
import { Track } from '../types';
import toast from 'react-hot-toast';

interface YouTubeSearchPanelProps {
  onImportCompleted?: (track: Track) => void;
  compact?: boolean;
}

const PRESET_QUERIES = [
  'Lofi Beats Chill',
  'Pop Hits 2024',
  'Sertanejo Hits',
  'Rock Clássico',
  'MPB Violão',
  'Músicas Infantis',
  'Música Eletrônica Synthwave',
];

export const YouTubeSearchPanel: React.FC<YouTubeSearchPanelProps> = ({
  onImportCompleted,
  compact = false,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const { activeProfile } = useProfile();
  const { globalTracks, addTrackToLibrary } = usePlaylist();

  // Monitor active downloads from DownloadManager
  useEffect(() => {
    const unsubscribe = downloadManager.subscribe((tasks) => {
      const activeYtIds = new Set<string>();
      tasks.forEach((task) => {
        if (
          task.status === 'Downloading' ||
          task.status === 'Processing' ||
          task.status === 'Preparing' ||
          task.status === 'Importing' ||
          task.status === 'Waiting'
        ) {
          if (task.youtubeId) activeYtIds.add(task.youtubeId);
        }
      });
      setDownloadingIds(activeYtIds);
    });
    return unsubscribe;
  }, []);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) return;

      setIsSearching(true);
      setHasSearched(true);
      try {
        const data = await searchYouTube(trimmed, 12);
        setResults(data);
        if (data.length === 0) {
          toast.error('Nenhum vídeo encontrado no YouTube para esta pesquisa.');
        }
      } catch (err) {
        console.error('[YouTubeSearchPanel] Error during search:', err);
        toast.error('Erro ao realizar busca no YouTube. Tente novamente.');
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  const handlePresetClick = (preset: string) => {
    setQuery(preset);
    handleSearch(preset);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  // Helper to check existing library track
  const getExistingTrack = (videoId: string): Track | undefined => {
    return globalTracks.find((t) => t.youtubeId === videoId);
  };

  const handleImportAndDownload = async (item: YouTubeSearchResult) => {
    const videoUrl = `https://www.youtube.com/watch?v=${item.videoId}`;
    const profileId = activeProfile?.id || 'm-1';

    let track = getExistingTrack(item.videoId);

    if (!track) {
      const added = addTrackToLibrary(item.title, item.channelName, videoUrl, profileId, {
        thumbnail: item.thumbnail,
        genre: 'YouTube',
      });

      if (!added) {
        toast.error('Não foi possível cadastrar a faixa na biblioteca.');
        return;
      }
      track = added;
    }

    // Check if already local
    if (track.source?.type === 'local') {
      toast.success(`"${track.title}" já está salva e pronta para reprodução offline!`);
      if (onImportCompleted) onImportCompleted(track);
      return;
    }

    // Trigger Download Flow via DownloadManager & YouTubeRestProvider
    const loadingToast = toast.loading(`Iniciando extração MP3 de "${track.title}"...`);
    
    setDownloadingIds((prev) => new Set(prev).add(item.videoId));

    try {
      const targetTrack = track;
      const success = await downloadManager.startDownload(targetTrack, (updatedTrack) => {
        if (onImportCompleted) onImportCompleted(updatedTrack);
      });

      toast.dismiss(loadingToast);

      if (success) {
        toast.success(
          <div>
            <p className="font-bold">"{item.title}" importada e baixada com sucesso!</p>
            <p className="text-3xs text-emerald-400 font-extrabold uppercase mt-0.5">
              Salva no IndexedDB para áudio offline 💾
            </p>
          </div>
        );
      } else {
        toast.error(`Falha ao baixar "${item.title}". Verifique a conexão ou tente outro vídeo.`);
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error('[YouTubeSearchPanel] Import download error:', err);
      toast.error('Erro ao processar download do YouTube.');
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.videoId);
        return next;
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Search Input Bar */}
      <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-2.5 w-full">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-purple-light">
            <Youtube className="w-5 h-5 text-red-500 animate-pulse" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar nome da música, artista ou colar URL do YouTube..."
            className="w-full pl-11 pr-10 py-3 bg-black/40 border border-brand-purple/40 hover:border-brand-purple rounded-2xl text-sm text-white placeholder-brand-text-muted/70 focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/30 transition-all shadow-inner"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-text-muted hover:text-white transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="px-6 py-3 bg-gradient-to-r from-brand-purple to-brand-cyan hover:from-brand-purple-light hover:to-cyan-400 text-white font-extrabold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-brand-purple/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Buscando...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Buscar</span>
            </>
          )}
        </button>
      </form>

      {/* Popular Preset Quick Chips */}
      {!hasSearched && (
        <div className="flex flex-col gap-2">
          <span className="text-3xs font-extrabold text-brand-text-muted uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-purple-light" /> Sugestões Populares para Busca:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_QUERIES.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className="px-3 py-1.5 bg-black/30 hover:bg-brand-purple/20 border border-brand-border/60 hover:border-brand-purple/50 rounded-xl text-xs font-bold text-brand-text-muted hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Music2 className="w-3 h-3 text-brand-cyan" />
                <span>{preset}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading State Skeleton */}
      {isSearching && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-2">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-brand-card/30 border border-brand-border/40 rounded-2xl p-3 flex gap-3 animate-pulse"
            >
              <div className="w-24 h-16 bg-white/5 rounded-xl shrink-0" />
              <div className="flex flex-col justify-center flex-1 gap-2">
                <div className="h-3.5 bg-white/10 rounded-md w-3/4" />
                <div className="h-2.5 bg-white/5 rounded-md w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search Results Grid */}
      {!isSearching && results.length > 0 && (
        <div className="flex flex-col gap-2.5 mt-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-2xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Youtube className="w-4 h-4 text-red-500" /> Resultados do YouTube ({results.length}):
            </span>
            <button
              onClick={() => handleSearch(query)}
              className="text-3xs text-brand-purple-light hover:text-white flex items-center gap-1 font-bold cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Atualizar
            </button>
          </div>

          <div className={`grid ${compact ? 'grid-cols-1 gap-2.5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5'}`}>
            {results.map((item) => {
              const existingTrack = getExistingTrack(item.videoId);
              const isLocal = existingTrack?.source?.type === 'local';
              const isDownloading = downloadingIds.has(item.videoId);

              return (
                <div
                  key={item.videoId}
                  className="bg-brand-surface/70 border border-brand-border/80 hover:border-brand-purple/50 rounded-2xl p-3 flex flex-col justify-between gap-3 group transition-all duration-200 hover:shadow-xl hover:shadow-brand-purple/10 backdrop-blur-md"
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail */}
                    <div className="relative w-28 aspect-video rounded-xl overflow-hidden bg-black shrink-0 border border-brand-border/60">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                    </div>

                    {/* Titles */}
                    <div className="min-w-0 flex-1">
                      <h4
                        className="text-xs font-black text-white group-hover:text-brand-purple-light transition-colors line-clamp-2 leading-snug"
                        title={item.title}
                      >
                        {item.title}
                      </h4>
                      <p className="text-3xs text-brand-text-muted font-bold truncate mt-1" title={item.channelName}>
                        📺 {item.channelName}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2 border-t border-brand-border/40 flex items-center justify-between gap-2">
                    <span className="text-3xs text-brand-text-muted font-mono font-semibold">
                      {isLocal ? 'Disponível Offline' : 'YouTube MP3'}
                    </span>

                    {isLocal ? (
                      <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-3xs font-black flex items-center gap-1 select-none">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Salvo Offline</span>
                      </span>
                    ) : isDownloading ? (
                      <span className="px-3 py-1.5 bg-brand-purple/30 text-brand-purple-light border border-brand-purple/50 rounded-xl text-3xs font-extrabold flex items-center gap-1.5 animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-cyan" />
                        <span>Baixando MP3...</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleImportAndDownload(item)}
                        className="px-3 py-1.5 bg-gradient-to-r from-brand-purple/30 to-brand-cyan/30 hover:from-brand-purple hover:to-brand-cyan border border-brand-purple/50 text-white rounded-xl text-3xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:scale-[1.02]"
                      >
                        <Download className="w-3.5 h-3.5 text-brand-cyan group-hover:text-white" />
                        <span>Importar & Baixar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty Search Result Feedback */}
      {hasSearched && !isSearching && results.length === 0 && (
        <div className="bg-black/30 border border-brand-border/60 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2">
          <AlertCircle className="w-8 h-8 text-amber-400 opacity-80" />
          <h4 className="text-sm font-bold text-white">Nenhum resultado encontrado</h4>
          <p className="text-2xs text-brand-text-muted max-w-sm">
            Tente buscar com palavras-chave diferentes ou cole a URL completa do vídeo do YouTube no campo de busca.
          </p>
        </div>
      )}
    </div>
  );
};
