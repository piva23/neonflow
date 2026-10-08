import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Music,
  Plus,
  Play,
  Trash2,
  ListPlus,
  ExternalLink,
  Sparkles,
  Check,
  LayoutGrid,
  List,
  Heart,
  Star,
  Edit2,
  Clock,
  SlidersHorizontal,
  Tag,
  Smile,
  Disc,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  Zap,
  Globe,
  Calendar,
  Compass,
  Layers,
  Activity,
  Award,
  Sun,
  CloudRain,
  Radio,
  Copy,
  HardDrive,
  Upload,
  Download,
  ArrowDownCircle,
  Search,
  Youtube,
} from 'lucide-react';
import { mediaLibrary } from '../core/media';
import { usePlaylist, useProfile, useApp, usePlayer, useTheme } from '../hooks';
import {
  PageHeader,
  Button,
  Input,
  GlassCard,
  EmptyState,
  Modal,
  DownloadModal,
  AddToPlaylistModal,
  MusicFilters,
  TrackOptionsMenu,
  TrackCard,
  YouTubeSearchPanel,
} from '../components';
import { toast } from 'react-hot-toast';
import { extractYoutubeId, getYoutubeThumbnail, fetchYoutubeMetadata } from '../utils/youtube';
import { motion, AnimatePresence } from 'motion/react';
import { Track } from '../types';
import {
  MultiTrackFilters,
  filterTracksWithMetadata,
  calculateTrackLibraryStats,
  formatDecadeLabel,
  getLanguageIcon,
} from '../utils/MetadataHelpers';
import {
  GENRE_OPTIONS,
  MOOD_OPTIONS,
  LANGUAGE_OPTIONS,
  DECADE_OPTIONS,
  OCCASION_OPTIONS,
  EMOTION_OPTIONS,
  WEATHER_OPTIONS,
  SEASON_OPTIONS,
  INSTRUMENT_OPTIONS,
  TAG_PRESETS,
} from '../utils/MetadataConstants';
import { MusicMetadataService } from '../services/MusicMetadataService';

export const Biblioteca: React.FC = () => {
  const navigate = useNavigate();
  const {
    globalTracks,
    addTrackToLibrary,
    addImportedTrack,
    deleteTrackFromLibrary,
    duplicateTrackInLibrary,
    playlists,
    addTrackToPlaylist,
    toggleFavoriteTrack,
    updateTrackRating,
    updateTrack,
  } = usePlaylist();

  const { activeProfile, profiles, updateXp } = useProfile();
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  // Local File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local File Import Handler
  const handleLocalFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);
    const loadingToast = toast.loading(`Importando ${fileList.length} arquivo(s) local(is)...`);

    let importedCount = 0;
    for (const file of fileList) {
      try {
        const { track } = await mediaLibrary.importFile(file);
        addImportedTrack(track, activeProfile?.id);
        importedCount++;
      } catch (err) {
        console.error('[Biblioteca] Erro ao importar arquivo local:', file.name, err);
      }
    }

    toast.dismiss(loadingToast);

    if (importedCount > 0) {
      toast.success(
        <div>
          <p className="font-bold">{importedCount} música{importedCount > 1 ? 's' : ''} importada{importedCount > 1 ? 's' : ''} com sucesso!</p>
          <p className="text-3xs text-emerald-400 font-black uppercase mt-1">
            Salva{importedCount > 1 ? 's' : ''} com segurança no IndexedDB 💾
          </p>
        </div>
      );
      if (activeProfile) {
        updateXp(activeProfile.id, importedCount * 100);
      }
    } else {
      toast.error('Nenhum arquivo puder ser importado. Formatos suportados: MP3, M4A, FLAC, WAV, OGG, AAC.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Layout controls
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('recent');
  const itemsPerPage = 8;

  // Filter State
  const [filters, setFilters] = useState<MultiTrackFilters>({
    searchQuery: '',
    genres: [],
    moods: [],
    languages: [],
    decades: [],
    occasions: [],
    tags: [],
    onlyFavorites: false,
  });

  // Modals & UI Sections
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showSearchSection, setShowSearchSection] = useState(false);
  const [addModalImportMode, setAddModalImportMode] = useState<'search' | 'manual'>('search');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadTrack, setDownloadTrack] = useState<Track | null>(null);

  const handleOpenDownloadModal = (track: Track) => {
    setDownloadTrack(track);
    setIsDownloadModalOpen(true);
  };

  // Form State - Add
  const [addFormUrl, setAddFormUrl] = useState('');
  const [addFormTitle, setAddFormTitle] = useState('');
  const [addFormArtist, setAddFormArtist] = useState('');
  const [addFormAlbum, setAddFormAlbum] = useState('');
  const [addFormDuration, setAddFormDuration] = useState('3:30');
  const [addFormThumbnail, setAddFormThumbnail] = useState('');
  const [addFormGenres, setAddFormGenres] = useState<string[]>(['Pop']);
  const [addFormMoods, setAddFormMoods] = useState<string[]>(['Happy']);
  const [addFormLanguages, setAddFormLanguages] = useState<string[]>(['Português']);
  const [addFormDecades, setAddFormDecades] = useState<string[]>(['2020']);
  const [addFormInstruments, setAddFormInstruments] = useState<string[]>([]);
  const [addFormEnergy, setAddFormEnergy] = useState<number>(75);
  const [addFormRelax, setAddFormRelax] = useState<number>(50);
  const [addFormDance, setAddFormDance] = useState<number>(70);
  const [addFormFocus, setAddFormFocus] = useState<number>(50);
  const [addFormEmotion, setAddFormEmotion] = useState<string>('Alegre');
  const [addFormWeather, setAddFormWeather] = useState<string>('Ensolarado');
  const [addFormSeason, setAddFormSeason] = useState<string>('Verão');
  const [addFormOccasion, setAddFormOccasion] = useState<string[]>(['Viagem']);
  const [addFormTags, setAddFormTags] = useState<string[]>([]);
  const [addFormNotes, setAddFormNotes] = useState('');
  const [addFormModalTab, setAddFormModalTab] = useState<'basic' | 'metadata' | 'metrics'>('basic');

  // Form State - Edit
  const [editFormTitle, setEditFormTitle] = useState('');
  const [editFormArtist, setEditFormArtist] = useState('');
  const [editFormAlbum, setEditFormAlbum] = useState('');
  const [editFormDuration, setEditFormDuration] = useState('3:30');
  const [editFormThumbnail, setEditFormThumbnail] = useState('');
  const [editFormGenres, setEditFormGenres] = useState<string[]>([]);
  const [editFormMoods, setEditFormMoods] = useState<string[]>([]);
  const [editFormLanguages, setEditFormLanguages] = useState<string[]>([]);
  const [editFormDecades, setEditFormDecades] = useState<string[]>([]);
  const [editFormInstruments, setEditFormInstruments] = useState<string[]>([]);
  const [editFormEnergy, setEditFormEnergy] = useState<number>(50);
  const [editFormRelax, setEditFormRelax] = useState<number>(50);
  const [editFormDance, setEditFormDance] = useState<number>(50);
  const [editFormFocus, setEditFormFocus] = useState<number>(50);
  const [editFormEmotion, setEditFormEmotion] = useState<string>('Alegre');
  const [editFormWeather, setEditFormWeather] = useState<string>('Ensolarado');
  const [editFormSeason, setEditFormSeason] = useState<string>('Verão');
  const [editFormOccasion, setEditFormOccasion] = useState<string[]>([]);
  const [editFormTags, setEditFormTags] = useState<string[]>([]);
  const [editFormNotes, setEditFormNotes] = useState('');
  const [editFormModalTab, setEditFormModalTab] = useState<'basic' | 'metadata' | 'metrics'>('basic');
  const [isFetchingYt, setIsFetchingYt] = useState(false);

  // URL Change Handler with Auto-Metadata Fetching
  const handleUrlChange = async (url: string) => {
    setAddFormUrl(url);
    const id = extractYoutubeId(url);
    if (id && id.length === 11) {
      setAddFormThumbnail(getYoutubeThumbnail(id));
      setIsFetchingYt(true);
      try {
        const meta = await fetchYoutubeMetadata(url);
        if (meta) {
          setAddFormTitle(meta.title);
          setAddFormArtist(meta.artist);
          setAddFormThumbnail(meta.thumbnail);
        }
      } catch (e) {
        console.warn('Erro ao auto-puxar dados do YouTube:', e);
      } finally {
        setIsFetchingYt(false);
      }
    }
  };

  const handleFetchYoutubeInfo = async () => {
    if (!addFormUrl.trim()) {
      toast.error('Informe um link do YouTube primeiro.');
      return;
    }
    const id = extractYoutubeId(addFormUrl);
    if (!id || id.length !== 11) {
      toast.error('URL do YouTube não reconhecida.');
      return;
    }
    setIsFetchingYt(true);
    const loadingToast = toast.loading('Puxando informações do vídeo no YouTube...');
    try {
      const meta = await fetchYoutubeMetadata(addFormUrl);
      toast.dismiss(loadingToast);
      if (meta) {
        setAddFormTitle(meta.title);
        setAddFormArtist(meta.artist);
        setAddFormThumbnail(meta.thumbnail);
        toast.success(`Informações de "${meta.title}" puxadas com sucesso!`);
      } else {
        toast.error('Não foi possível obter os dados do vídeo.');
      }
    } catch (e) {
      toast.dismiss(loadingToast);
      toast.error('Erro ao conectar com o YouTube.');
    } finally {
      setIsFetchingYt(false);
    }
  };

  const parseDuration = (durStr: string): number => {
    try {
      if (!durStr) return 210;
      const parts = durStr.split(':');
      if (parts.length === 2) {
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      }
      return parseInt(durStr, 10) || 210;
    } catch {
      return 210;
    }
  };

  const formatSeconds = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Submit Add Form
  const handleAddTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!addFormUrl.trim()) {
      toast.error('O link do YouTube é obrigatório!');
      return;
    }

    const ytId = extractYoutubeId(addFormUrl);
    if (!ytId || ytId.length !== 11) {
      toast.error('URL do YouTube inválida ou não reconhecida.');
      return;
    }

    if (!activeProfile) {
      toast.error('Selecione um perfil ativo antes de adicionar.');
      return;
    }

    const title = addFormTitle.trim() || 'Música do YouTube';
    const artist = addFormArtist.trim() || 'Artista Desconhecido';
    const album = addFormAlbum.trim() || 'Álbum Desconhecido';
    const durationSecs = parseDuration(addFormDuration);

    const extraFields: Partial<Track> = {
      album,
      thumbnail: addFormThumbnail.trim() || getYoutubeThumbnail(ytId),
      duration: durationSecs,
      genre: addFormGenres[0] || 'Geral',
      genres: addFormGenres.length > 0 ? addFormGenres : ['Geral'],
      moods: addFormMoods,
      languages: addFormLanguages,
      decades: addFormDecades,
      instruments: addFormInstruments,
      energyLevel: addFormEnergy,
      relaxLevel: addFormRelax,
      danceLevel: addFormDance,
      focusLevel: addFormFocus,
      emotion: addFormEmotion,
      weather: addFormWeather,
      season: addFormSeason,
      occasion: addFormOccasion,
      tags: addFormTags,
      notes: addFormNotes,
      favorite: false,
      rating: 0,
      timesPlayed: 0,
    };

    const added = addTrackToLibrary(
      title,
      artist,
      addFormUrl,
      activeProfile.id,
      extraFields
    );

    if (added) {
      updateXp(activeProfile.id, 150);
      toast.success(
        <div>
          <p className="font-bold">"{title}" importada e cadastrada com sucesso!</p>
          <p className="text-3xs text-emerald-400 font-black uppercase mt-1">
            Pronta para execução offline em IndexedDB 💾 • +150 XP 🌟
          </p>
        </div>
      );

      // Reset
      setAddFormUrl('');
      setAddFormTitle('');
      setAddFormArtist('');
      setAddFormAlbum('');
      setAddFormThumbnail('');
      setAddFormNotes('');
      setIsAddModalOpen(false);
      setCurrentPage(1);
    } else {
      toast.error('Música com este ID de vídeo já existe na biblioteca!');
    }
  };

  // Click Edit Track
  const handleEditTrackClick = (track: Track) => {
    setEditingTrack(track);
    setEditFormTitle(track.title || '');
    setEditFormArtist(track.artist || '');
    setEditFormAlbum(track.album || '');
    setEditFormDuration(formatSeconds(track.duration || 210));
    setEditFormThumbnail(track.thumbnail || '');
    setEditFormGenres(track.genres || (track.genre ? [track.genre] : ['Geral']));
    setEditFormMoods(track.moods || []);
    setEditFormLanguages(track.languages || ['Português']);
    setEditFormDecades(track.decades || ['2020']);
    setEditFormInstruments(track.instruments || []);
    setEditFormEnergy(track.energyLevel ?? 50);
    setEditFormRelax(track.relaxLevel ?? 50);
    setEditFormDance(track.danceLevel ?? 50);
    setEditFormFocus(track.focusLevel ?? 50);
    setEditFormEmotion(track.emotion || 'Alegre');
    setEditFormWeather(track.weather || 'Ensolarado');
    setEditFormSeason(track.season || 'Verão');
    setEditFormOccasion(Array.isArray(track.occasion) ? track.occasion : track.occasion ? [track.occasion] : []);
    setEditFormTags(track.tags || []);
    setEditFormNotes(track.notes || '');
    setIsEditModalOpen(true);
  };

  // Submit Edit Form
  const handleEditTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrack) return;

    const durationSecs = parseDuration(editFormDuration);

    const updated: Partial<Track> = {
      title: editFormTitle.trim() || 'Música Sem Título',
      artist: editFormArtist.trim() || 'Artista Desconhecido',
      album: editFormAlbum.trim() || 'Álbum Desconhecido',
      genre: editFormGenres[0] || 'Geral',
      genres: editFormGenres.length > 0 ? editFormGenres : ['Geral'],
      moods: editFormMoods,
      languages: editFormLanguages,
      decades: editFormDecades,
      instruments: editFormInstruments,
      energyLevel: editFormEnergy,
      relaxLevel: editFormRelax,
      danceLevel: editFormDance,
      focusLevel: editFormFocus,
      emotion: editFormEmotion,
      weather: editFormWeather,
      season: editFormSeason,
      occasion: editFormOccasion,
      tags: editFormTags,
      notes: editFormNotes,
      thumbnail: editFormThumbnail.trim() || getYoutubeThumbnail(editingTrack.youtubeId),
      duration: durationSecs,
    };

    updateTrack(editingTrack.id, updated);
    toast.success('Música atualizada com sucesso!');
    setIsEditModalOpen(false);
    setEditingTrack(null);
  };

  // Toggle helper for multi-select array inputs in forms
  const toggleFormArrayItem = (
    item: string,
    state: string[],
    setState: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (state.includes(item)) {
      setState(state.filter((i) => i !== item));
    } else {
      setState([...state, item]);
    }
  };

  const handleDeleteTrack = (id: string, title: string) => {
    deleteTrackFromLibrary(id);
    toast.success(`Música "${title}" excluída com sucesso.`);
  };

  const handleDuplicateTrack = (id: string, title: string) => {
    const copy = duplicateTrackInLibrary(id);
    if (copy) {
      toast.success(`Música duplicada com sucesso: "${copy.title}"`);
    } else {
      toast.error('Erro ao duplicar música.');
    }
  };

  const handleOpenPlaylistPicker = (trackId: string) => {
    setSelectedTrackId(trackId);
    setIsPlaylistModalOpen(true);
  };

  // Filter & Sort Pipeline
  const filteredAndSortedTracks = useMemo(() => {
    let result = filterTracksWithMetadata(globalTracks, filters);

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'recent') {
        const dateA = new Date(a.createdAt || a.addedAt || 0).getTime();
        const dateB = new Date(b.createdAt || b.addedAt || 0).getTime();
        return dateB - dateA;
      }
      if (sortBy === 'most-played') {
        const playsA = a.timesPlayed !== undefined ? a.timesPlayed : a.playsCount || 0;
        const playsB = b.timesPlayed !== undefined ? b.timesPlayed : b.playsCount || 0;
        return playsB - playsA;
      }
      if (sortBy === 'energy') {
        return (b.energyLevel ?? 0) - (a.energyLevel ?? 0);
      }
      if (sortBy === 'focus') {
        return (b.focusLevel ?? 0) - (a.focusLevel ?? 0);
      }
      if (sortBy === 'relax') {
        return (b.relaxLevel ?? 0) - (a.relaxLevel ?? 0);
      }
      if (sortBy === 'longest') {
        return (b.duration || 0) - (a.duration || 0);
      }
      if (sortBy === 'shortest') {
        return (a.duration || 0) - (b.duration || 0);
      }
      return 0;
    });

    return result;
  }, [globalTracks, filters, sortBy]);

  // Overall Library Statistics
  const libraryStats = useMemo(() => {
    return calculateTrackLibraryStats(globalTracks);
  }, [globalTracks]);

  // Pagination
  const totalItems = filteredAndSortedTracks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedTracks = useMemo(() => {
    const maxPage = Math.max(1, totalPages);
    const activePage = currentPage > maxPage ? maxPage : currentPage;
    const startIndex = (activePage - 1) * itemsPerPage;
    return filteredAndSortedTracks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedTracks, currentPage, totalPages]);

  // Star Rating Component
  const StarRating: React.FC<{
    rating: number;
    onRatingChange: (rating: number) => void;
    interactive?: boolean;
  }> = ({ rating, onRatingChange, interactive = true }) => {
    const [hoveredRating, setHoveredRating] = useState<number | null>(null);

    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const active = hoveredRating !== null ? star <= hoveredRating : star <= rating;
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => onRatingChange(star)}
              onMouseEnter={() => interactive && setHoveredRating(star)}
              onMouseLeave={() => interactive && setHoveredRating(null)}
              className={`transition-all ${
                interactive ? 'cursor-pointer hover:scale-125 p-0.5' : 'cursor-default p-0'
              } ${active ? 'text-amber-400' : 'text-zinc-600'}`}
            >
              <Star className={`w-3.5 h-3.5 ${active ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'}`} />
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <PageHeader
        title="Biblioteca Musical Inteligente"
        description="Acervo de áudio familiar enriquecido com metadados de energia, foco, moods, décadas e ocasiões. Importe arquivos MP3 locais ou cadastre links do YouTube."
        actionSlot={
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="file"
              ref={fileInputRef}
              accept=".mp3,.m4a,.flac,.wav,.ogg,.aac"
              multiple
              onChange={handleLocalFileImport}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
              className="bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25 cursor-pointer flex items-center gap-2"
            >
              <Upload className="w-4 h-4 text-emerald-400" /> Importar MP3
            </Button>
            <Button
              onClick={() => setShowSearchSection(!showSearchSection)}
              variant="secondary"
              className={`border-red-500/40 cursor-pointer flex items-center gap-2 transition-all ${
                showSearchSection
                  ? 'bg-red-500/30 text-white border-red-500 shadow-lg shadow-red-500/20'
                  : 'bg-red-500/15 text-red-300 hover:bg-red-500/25'
              }`}
            >
              <Search className="w-4 h-4 text-red-400" />
              <span>Busca no YouTube</span>
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)} variant="primary" glow>
              <Plus className="w-4 h-4" /> Cadastrar YouTube
            </Button>
          </div>
        }
      />

      {/* Expandable YouTube Search Section */}
      <AnimatePresence>
        {showSearchSection && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard className="p-5 border-red-500/30 bg-gradient-to-b from-red-950/20 to-black/40 relative">
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-500/20 border border-red-500/40 rounded-xl">
                    <Youtube className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Busca Direta no YouTube</h3>
                    <p className="text-2xs text-brand-text-muted">
                      Pesquise músicas, importe dados e baixe arquivos MP3 para IndexedDB sem sair da aplicação
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSearchSection(false)}
                  className="text-xs text-brand-text-muted hover:text-white px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 cursor-pointer"
                >
                  Fechar ✕
                </button>
              </div>

              <YouTubeSearchPanel />
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-Navegação por Seções da Biblioteca */}
      <div className="flex flex-wrap items-center gap-2 bg-brand-surface/60 border border-brand-border/60 p-2.5 rounded-2xl backdrop-blur-md">
        <button
          onClick={() => setFilters({ ...filters, sourceType: 'all', onlyFavorites: false })}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border ${
            (!filters.sourceType || filters.sourceType === 'all') && !filters.onlyFavorites
              ? 'bg-brand-purple text-white border-brand-purple shadow-lg shadow-brand-purple/20'
              : 'bg-black/30 text-brand-text-muted border-brand-border/60 hover:text-white hover:border-white/20'
          }`}
        >
          <Music className="w-3.5 h-3.5" /> Todas as Músicas
        </button>

        <button
          onClick={() => setFilters({ ...filters, sourceType: 'youtube', onlyFavorites: false })}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border ${
            filters.sourceType === 'youtube' && !filters.onlyFavorites
              ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/20'
              : 'bg-black/30 text-brand-text-muted border-brand-border/60 hover:text-white hover:border-white/20'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-red-400" /> YouTube
        </button>

        <button
          onClick={() => setFilters({ ...filters, sourceType: 'local', onlyFavorites: false })}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border ${
            filters.sourceType === 'local' && !filters.onlyFavorites
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/20'
              : 'bg-black/30 text-brand-text-muted border-brand-border/60 hover:text-white hover:border-white/20'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> MP3 Local
        </button>

        <button
          onClick={() => setFilters({ ...filters, sourceType: 'all', onlyFavorites: true })}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border ${
            filters.onlyFavorites
              ? 'bg-amber-500 text-black font-black border-amber-400 shadow-lg shadow-amber-500/20'
              : 'bg-black/30 text-brand-text-muted border-brand-border/60 hover:text-white hover:border-white/20'
          }`}
        >
          <Heart className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Favoritos
        </button>

        <button
          onClick={() => navigate('/history')}
          className="px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border bg-black/30 text-brand-text-muted border-brand-border/60 hover:text-white hover:border-white/20 ml-auto"
        >
          <Clock className="w-3.5 h-3.5" /> Histórico
        </button>
      </div>

      {/* Intelligence Dashboard Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-brand-surface/60 border border-brand-border/60 rounded-2xl p-3.5 flex flex-col justify-between backdrop-blur-md">
          <span className="text-3xs font-black uppercase tracking-wider text-brand-text-muted flex items-center gap-1">
            <Radio className="w-3 h-3 text-brand-purple" /> Acervo Total
          </span>
          <span className="text-xl font-black text-white mt-1">{libraryStats.totalTracks} músicas</span>
        </div>

        <div className="bg-brand-surface/60 border border-brand-border/60 rounded-2xl p-3.5 flex flex-col justify-between backdrop-blur-md">
          <span className="text-3xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1">
            <Flame className="w-3 h-3" /> Energia Média
          </span>
          <span className="text-xl font-black text-red-400 mt-1">{libraryStats.avgEnergy}%</span>
        </div>

        <div className="bg-brand-surface/60 border border-brand-border/60 rounded-2xl p-3.5 flex flex-col justify-between backdrop-blur-md">
          <span className="text-3xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Relax Módulo
          </span>
          <span className="text-xl font-black text-emerald-400 mt-1">{libraryStats.avgRelax}%</span>
        </div>

        <div className="bg-brand-surface/60 border border-brand-border/60 rounded-2xl p-3.5 flex flex-col justify-between backdrop-blur-md">
          <span className="text-3xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Foco
          </span>
          <span className="text-xl font-black text-indigo-400 mt-1">{libraryStats.avgFocus}%</span>
        </div>

        <div className="bg-brand-surface/60 border border-brand-border/60 rounded-2xl p-3.5 flex flex-col justify-between backdrop-blur-md">
          <span className="text-3xs font-black uppercase tracking-wider text-brand-cyan flex items-center gap-1">
            <Music className="w-3 h-3" /> Gênero Dominante
          </span>
          <span className="text-sm font-black text-white truncate mt-1">{libraryStats.topGenre}</span>
        </div>

        <div className="bg-brand-surface/60 border border-brand-border/60 rounded-2xl p-3.5 flex flex-col justify-between backdrop-blur-md">
          <span className="text-3xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Década Top
          </span>
          <span className="text-sm font-black text-white truncate mt-1">
            {formatDecadeLabel(libraryStats.topDecade)}
          </span>
        </div>
      </div>

      {/* Advanced Multi-Criteria Music Filters */}
      <MusicFilters filters={filters} onChange={setFilters} totalResults={totalItems} />

      {/* Sort & View Mode Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-brand-surface/40 p-3 rounded-2xl border border-brand-border/40">
        <div className="flex items-center gap-2">
          <span className="text-3xs font-extrabold uppercase tracking-wider text-brand-text-muted flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" /> Ordenação:
          </span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-black/40 text-xs font-bold text-white border border-brand-border/60 rounded-xl px-3 py-1.5 outline-none cursor-pointer"
          >
            <option value="recent">Mais Recentes</option>
            <option value="alphabetical">Alfabética (A-Z)</option>
            <option value="most-played">Mais Tocadas</option>
            <option value="energy">Maior Energia 🔥</option>
            <option value="focus">Maior Foco 🎯</option>
            <option value="relax">Maior Relaxamento 🌿</option>
            <option value="longest">Maior Duração</option>
            <option value="shortest">Menor Duração</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-brand-border/60">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-brand-purple text-white' : 'text-brand-text-muted hover:text-white'
              }`}
              title="Modo Grade"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-brand-purple text-white' : 'text-brand-text-muted hover:text-white'
              }`}
              title="Modo Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Track List / Grid */}
      {globalTracks.length === 0 ? (
        <EmptyState
          title="Sua biblioteca de músicas está vazia"
          description="Comece a adicionar faixas para toda a família! Faça upload de arquivos MP3 do seu computador ou adicione links do YouTube."
          action={
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <Button onClick={() => fileInputRef.current?.click()} variant="glow">
                <Upload className="w-4 h-4" /> Importar MP3
              </Button>
              <Button onClick={() => setIsAddModalOpen(true)} variant="secondary">
                <Plus className="w-4 h-4" /> Adicionar YouTube
              </Button>
            </div>
          }
        />
      ) : paginatedTracks.length === 0 ? (
        <EmptyState
          title="Nenhuma música encontrada"
          description="Tente ajustar os filtros de gênero, mood, idioma ou faixa de energia para visualizar canções."
          actionLabel="Limpar Filtros"
          onActionClick={() =>
            setFilters({
              searchQuery: '',
              genres: [],
              moods: [],
              languages: [],
              decades: [],
              occasions: [],
              tags: [],
              onlyFavorites: false,
            })
          }
        />
      ) : viewMode === 'grid' ? (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          <AnimatePresence mode="popLayout">
            {paginatedTracks.map((track) => (
              <motion.div
                key={track.id}
                layoutId={`card-${track.id}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <TrackCard
                  track={track}
                  layoutTracks={filteredAndSortedTracks}
                  viewMode="grid"
                  profiles={profiles}
                  onOpenPlaylistPicker={handleOpenPlaylistPicker}
                  onEdit={handleEditTrackClick}
                  onDelete={handleDeleteTrack}
                  onDownload={handleOpenDownloadModal}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* List View */
        <motion.div layout className="flex flex-col gap-2.5">
          <AnimatePresence mode="popLayout">
            {paginatedTracks.map((track) => (
              <motion.div
                key={track.id}
                layoutId={`list-row-${track.id}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
              >
                <TrackCard
                  track={track}
                  layoutTracks={filteredAndSortedTracks}
                  viewMode="list"
                  profiles={profiles}
                  onOpenPlaylistPicker={handleOpenPlaylistPicker}
                  onEdit={handleEditTrackClick}
                  onDelete={handleDeleteTrack}
                  onDownload={handleOpenDownloadModal}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-brand-card/25 border border-brand-border/60 rounded-2xl">
          <span className="text-xs text-brand-text-muted font-bold">
            Página <span className="text-white">{currentPage}</span> de <span className="text-white">{totalPages}</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-brand-border hover:bg-white/5 text-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-brand-border hover:bg-white/5 text-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL: ADD TRACK */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Cadastrar ou Pesquisar Músicas no YouTube">
        <div className="flex flex-col gap-4">
          {/* Main Mode Selector: Search vs Manual */}
          <div className="grid grid-cols-2 gap-2 bg-black/40 p-1.5 rounded-2xl border border-brand-border/60">
            <button
              type="button"
              onClick={() => setAddModalImportMode('search')}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                addModalImportMode === 'search'
                  ? 'bg-gradient-to-r from-red-600 to-brand-purple text-white border-red-500/50 shadow-md'
                  : 'text-brand-text-muted hover:text-white border-transparent'
              }`}
            >
              <Search className="w-4 h-4 text-red-400" />
              <span>Busca Interna YouTube</span>
            </button>
            <button
              type="button"
              onClick={() => setAddModalImportMode('manual')}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                addModalImportMode === 'manual'
                  ? 'bg-brand-purple text-white border-brand-purple/50 shadow-md'
                  : 'text-brand-text-muted hover:text-white border-transparent'
              }`}
            >
              <Plus className="w-4 h-4 text-brand-purple-light" />
              <span>Colar Link / Cadastro Manual</span>
            </button>
          </div>

          {addModalImportMode === 'search' ? (
            <div className="py-2">
              <YouTubeSearchPanel compact onImportCompleted={() => setIsAddModalOpen(false)} />
            </div>
          ) : (
            <form onSubmit={handleAddTrackSubmit} className="flex flex-col gap-4">
              {/* Modal Tab Switcher */}
              <div className="flex items-center gap-2 border-b border-brand-border/60 pb-2">
                <button
                  type="button"
                  onClick={() => setAddFormModalTab('basic')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    addFormModalTab === 'basic' ? 'bg-brand-purple text-white' : 'text-brand-text-muted hover:text-white'
                  }`}
                >
                  1. Informações Básicas
                </button>
                <button
                  type="button"
                  onClick={() => setAddFormModalTab('metadata')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    addFormModalTab === 'metadata' ? 'bg-brand-purple text-white' : 'text-brand-text-muted hover:text-white'
                  }`}
                >
                  2. Gêneros, Moods & Décadas
                </button>
                <button
                  type="button"
                  onClick={() => setAddFormModalTab('metrics')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    addFormModalTab === 'metrics' ? 'bg-brand-purple text-white' : 'text-brand-text-muted hover:text-white'
                  }`}
                >
                  3. Níveis & Métricas
                </button>
              </div>

          {/* Tab 1: Basic */}
          {addFormModalTab === 'basic' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    label="Link do YouTube"
                    placeholder="Ex: https://www.youtube.com/watch?v=ru0K8uYEZWw"
                    value={addFormUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleFetchYoutubeInfo}
                  disabled={isFetchingYt}
                  variant="secondary"
                  className="bg-brand-purple/20 text-brand-purple-light border-brand-purple/40 text-2xs px-3 py-2.5 cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-purple" />
                  {isFetchingYt ? 'Puxando...' : 'Puxar Dados'}
                </Button>
              </div>

              {/* Confirmation Preview Box */}
              {addFormThumbnail && (
                <div className="bg-black/40 border border-brand-purple/30 p-3 rounded-2xl flex items-center gap-3">
                  <img
                    src={addFormThumbnail}
                    alt="Preview"
                    className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-3xs font-extrabold uppercase text-brand-purple-light flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" /> Prévia dos Dados Puxados
                    </span>
                    <p className="text-xs font-bold text-white truncate mt-0.5">
                      {addFormTitle || 'Título da Música'}
                    </p>
                    <p className="text-2xs text-brand-text-muted truncate">
                      {addFormArtist || 'Artista'}
                    </p>
                  </div>
                </div>
              )}

              <Input
                label="Título da Música"
                placeholder="Ex: Can't Stop the Feeling!"
                value={addFormTitle}
                onChange={(e) => setAddFormTitle(e.target.value)}
                required
              />
              <Input
                label="Artista / Banda"
                placeholder="Ex: Justin Timberlake"
                value={addFormArtist}
                onChange={(e) => setAddFormArtist(e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Álbum"
                  placeholder="Ex: Trolls OST"
                  value={addFormAlbum}
                  onChange={(e) => setAddFormAlbum(e.target.value)}
                />
                <Input
                  label="Duração (mm:ss)"
                  placeholder="Ex: 3:36"
                  value={addFormDuration}
                  onChange={(e) => setAddFormDuration(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xs font-extrabold uppercase text-brand-text-muted">Anotações da Família</span>
                <textarea
                  value={addFormNotes}
                  onChange={(e) => setAddFormNotes(e.target.value)}
                  placeholder="Observações especiais..."
                  className="w-full h-16 bg-black/30 border border-brand-border/60 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Metadata */}
          {addFormModalTab === 'metadata' && (
            <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-1 scrollbar-none">
              {/* Genres */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-white">Gêneros Principais:</span>
                <div className="flex flex-wrap gap-1.5">
                  {GENRE_OPTIONS.map((g) => {
                    const sel = addFormGenres.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleFormArrayItem(g, addFormGenres, setAddFormGenres)}
                        className={`px-2.5 py-1 rounded-lg text-2xs font-bold cursor-pointer border ${
                          sel ? 'bg-brand-purple text-white border-brand-purple' : 'bg-black/30 text-brand-text-muted border-white/10'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Moods */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-white">Moods (Humor):</span>
                <div className="flex flex-wrap gap-1.5">
                  {MOOD_OPTIONS.map((m) => {
                    const sel = addFormMoods.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleFormArrayItem(m, addFormMoods, setAddFormMoods)}
                        className={`px-2.5 py-1 rounded-lg text-2xs font-bold cursor-pointer border ${
                          sel ? 'bg-brand-cyan text-brand-dark font-black border-brand-cyan' : 'bg-black/30 text-brand-text-muted border-white/10'
                        }`}
                      >
                        ✨ {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Languages */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-white">Idiomas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGE_OPTIONS.map((l) => {
                    const sel = addFormLanguages.includes(l);
                    return (
                      <button
                        key={l}
                        type="button"
                        onClick={() => toggleFormArrayItem(l, addFormLanguages, setAddFormLanguages)}
                        className={`px-2.5 py-1 rounded-lg text-2xs font-bold cursor-pointer border ${
                          sel ? 'bg-blue-600 text-white border-blue-500' : 'bg-black/30 text-brand-text-muted border-white/10'
                        }`}
                      >
                        {getLanguageIcon(l)} {l}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Decades */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-white">Década:</span>
                <div className="flex flex-wrap gap-1.5">
                  {DECADE_OPTIONS.map((d) => {
                    const sel = addFormDecades.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleFormArrayItem(d, addFormDecades, setAddFormDecades)}
                        className={`px-3 py-1 rounded-lg text-2xs font-bold cursor-pointer border ${
                          sel ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-black/30 text-brand-text-muted border-white/10'
                        }`}
                      >
                        {formatDecadeLabel(d)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Occasion */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-white">Ocasiões do Dia a Dia:</span>
                <div className="flex flex-wrap gap-1.5">
                  {OCCASION_OPTIONS.map((occ) => {
                    const sel = addFormOccasion.includes(occ);
                    return (
                      <button
                        key={occ}
                        type="button"
                        onClick={() => toggleFormArrayItem(occ, addFormOccasion, setAddFormOccasion)}
                        className={`px-2.5 py-1 rounded-lg text-2xs font-bold cursor-pointer border ${
                          sel ? 'bg-amber-600 text-white border-amber-500' : 'bg-black/30 text-brand-text-muted border-white/10'
                        }`}
                      >
                        🚗 {occ}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Free Tags */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-white">Tags Livres (Gamer, Desenhos, etc.):</span>
                <div className="flex flex-wrap gap-1.5">
                  {TAG_PRESETS.map((t) => {
                    const sel = addFormTags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleFormArrayItem(t, addFormTags, setAddFormTags)}
                        className={`px-2.5 py-1 rounded-lg text-2xs font-bold cursor-pointer border ${
                          sel ? 'bg-pink-600 text-white border-pink-500' : 'bg-black/30 text-brand-text-muted border-white/10'
                        }`}
                      >
                        #{t}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Level Sliders & Environment */}
          {addFormModalTab === 'metrics' && (
            <div className="flex flex-col gap-4">
              <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-red-400">🔥 Nível de Energia: {addFormEnergy}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={addFormEnergy}
                  onChange={(e) => setAddFormEnergy(Number(e.target.value))}
                  className="accent-red-500 cursor-pointer"
                />
              </div>

              <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-emerald-400">🌿 Nível de Relaxamento: {addFormRelax}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={addFormRelax}
                  onChange={(e) => setAddFormRelax(Number(e.target.value))}
                  className="accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-pink-400">💃 Nível de Dança: {addFormDance}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={addFormDance}
                  onChange={(e) => setAddFormDance(Number(e.target.value))}
                  className="accent-pink-500 cursor-pointer"
                />
              </div>

              <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-indigo-400">🎯 Nível de Foco: {addFormFocus}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={addFormFocus}
                  onChange={(e) => setAddFormFocus(Number(e.target.value))}
                  className="accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-3xs font-bold text-white">Emoção</span>
                  <select
                    value={addFormEmotion}
                    onChange={(e) => setAddFormEmotion(e.target.value)}
                    className="bg-black/30 border border-brand-border text-xs text-white p-2 rounded-xl"
                  >
                    {EMOTION_OPTIONS.map((em) => (
                      <option key={em} value={em}>
                        {em}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-3xs font-bold text-white">Clima Ideal</span>
                  <select
                    value={addFormWeather}
                    onChange={(e) => setAddFormWeather(e.target.value)}
                    className="bg-black/30 border border-brand-border text-xs text-white p-2 rounded-xl"
                  >
                    {WEATHER_OPTIONS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-3xs font-bold text-white">Estação</span>
                  <select
                    value={addFormSeason}
                    onChange={(e) => setAddFormSeason(e.target.value)}
                    className="bg-black/30 border border-brand-border text-xs text-white p-2 rounded-xl"
                  >
                    {SEASON_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-brand-border/40">
            <Button type="button" onClick={() => setIsAddModalOpen(false)} variant="ghost">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" glow>
              <Check className="w-4 h-4" /> Salvar Música
            </Button>
          </div>
        </form>
      )}
    </div>
  </Modal>

      {/* MODAL: EDIT TRACK */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Metadados da Música">
        <form onSubmit={handleEditTrackSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-brand-border/60 pb-2">
            <button
              type="button"
              onClick={() => setEditFormModalTab('basic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                editFormModalTab === 'basic' ? 'bg-brand-purple text-white' : 'text-brand-text-muted hover:text-white'
              }`}
            >
              1. Básicos
            </button>
            <button
              type="button"
              onClick={() => setEditFormModalTab('metadata')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                editFormModalTab === 'metadata' ? 'bg-brand-purple text-white' : 'text-brand-text-muted hover:text-white'
              }`}
            >
              2. Metadados
            </button>
            <button
              type="button"
              onClick={() => setEditFormModalTab('metrics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                editFormModalTab === 'metrics' ? 'bg-brand-purple text-white' : 'text-brand-text-muted hover:text-white'
              }`}
            >
              3. Níveis & Métricas
            </button>
          </div>

          {editFormModalTab === 'basic' && (
            <div className="flex flex-col gap-3">
              <Input
                label="Título"
                value={editFormTitle}
                onChange={(e) => setEditFormTitle(e.target.value)}
                required
              />
              <Input
                label="Artista"
                value={editFormArtist}
                onChange={(e) => setEditFormArtist(e.target.value)}
                required
              />
              <Input label="Álbum" value={editFormAlbum} onChange={(e) => setEditFormAlbum(e.target.value)} />
              <Input
                label="Duração (mm:ss)"
                value={editFormDuration}
                onChange={(e) => setEditFormDuration(e.target.value)}
              />
              <div className="flex flex-col gap-1">
                <span className="text-2xs font-extrabold uppercase text-brand-text-muted">Observações</span>
                <textarea
                  value={editFormNotes}
                  onChange={(e) => setEditFormNotes(e.target.value)}
                  className="w-full h-16 bg-black/30 border border-brand-border/60 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>
          )}

          {editFormModalTab === 'metadata' && (
            <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-1 scrollbar-none">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-white">Gêneros:</span>
                <div className="flex flex-wrap gap-1.5">
                  {GENRE_OPTIONS.map((g) => {
                    const sel = editFormGenres.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleFormArrayItem(g, editFormGenres, setEditFormGenres)}
                        className={`px-2.5 py-1 rounded-lg text-2xs font-bold cursor-pointer border ${
                          sel ? 'bg-brand-purple text-white border-brand-purple' : 'bg-black/30 text-brand-text-muted border-white/10'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-white">Moods:</span>
                <div className="flex flex-wrap gap-1.5">
                  {MOOD_OPTIONS.map((m) => {
                    const sel = editFormMoods.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleFormArrayItem(m, editFormMoods, setEditFormMoods)}
                        className={`px-2.5 py-1 rounded-lg text-2xs font-bold cursor-pointer border ${
                          sel ? 'bg-brand-cyan text-brand-dark font-black border-brand-cyan' : 'bg-black/30 text-brand-text-muted border-white/10'
                        }`}
                      >
                        ✨ {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-white">Idiomas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGE_OPTIONS.map((l) => {
                    const sel = editFormLanguages.includes(l);
                    return (
                      <button
                        key={l}
                        type="button"
                        onClick={() => toggleFormArrayItem(l, editFormLanguages, setEditFormLanguages)}
                        className={`px-2.5 py-1 rounded-lg text-2xs font-bold cursor-pointer border ${
                          sel ? 'bg-blue-600 text-white border-blue-500' : 'bg-black/30 text-brand-text-muted border-white/10'
                        }`}
                      >
                        {getLanguageIcon(l)} {l}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-white">Décadas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {DECADE_OPTIONS.map((d) => {
                    const sel = editFormDecades.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleFormArrayItem(d, editFormDecades, setEditFormDecades)}
                        className={`px-3 py-1 rounded-lg text-2xs font-bold cursor-pointer border ${
                          sel ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-black/30 text-brand-text-muted border-white/10'
                        }`}
                      >
                        {formatDecadeLabel(d)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-white">Tags Livres:</span>
                <div className="flex flex-wrap gap-1.5">
                  {TAG_PRESETS.map((t) => {
                    const sel = editFormTags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleFormArrayItem(t, editFormTags, setEditFormTags)}
                        className={`px-2.5 py-1 rounded-lg text-2xs font-bold cursor-pointer border ${
                          sel ? 'bg-pink-600 text-white border-pink-500' : 'bg-black/30 text-brand-text-muted border-white/10'
                        }`}
                      >
                        #{t}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {editFormModalTab === 'metrics' && (
            <div className="flex flex-col gap-4">
              <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-red-400">🔥 Nível de Energia: {editFormEnergy}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editFormEnergy}
                  onChange={(e) => setEditFormEnergy(Number(e.target.value))}
                  className="accent-red-500 cursor-pointer"
                />
              </div>

              <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-emerald-400">🌿 Nível de Relaxamento: {editFormRelax}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editFormRelax}
                  onChange={(e) => setEditFormRelax(Number(e.target.value))}
                  className="accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-pink-400">💃 Nível de Dança: {editFormDance}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editFormDance}
                  onChange={(e) => setEditFormDance(Number(e.target.value))}
                  className="accent-pink-500 cursor-pointer"
                />
              </div>

              <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-indigo-400">🎯 Nível de Foco: {editFormFocus}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editFormFocus}
                  onChange={(e) => setEditFormFocus(Number(e.target.value))}
                  className="accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-brand-border/40">
            <Button type="button" onClick={() => setIsEditModalOpen(false)} variant="ghost">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" glow>
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Modal>

      {/* Playlist Modal */}
      <AddToPlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => {
          setIsPlaylistModalOpen(false);
          setSelectedTrackId(null);
        }}
        track={globalTracks.find((t) => t.id === selectedTrackId) || null}
      />

      {/* Download Modal */}
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        track={downloadTrack}
      />
    </div>
  );
};
