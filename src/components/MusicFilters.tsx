import React, { useState } from 'react';
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  Flame,
  Zap,
  Sparkles,
  Smile,
  Globe,
  Calendar,
  Compass,
  Tag,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MultiTrackFilters, formatDecadeLabel, getLanguageIcon } from '../utils/MetadataHelpers';
import {
  GENRE_OPTIONS,
  MOOD_OPTIONS,
  LANGUAGE_OPTIONS,
  DECADE_OPTIONS,
  OCCASION_OPTIONS,
  TAG_PRESETS,
} from '../utils/MetadataConstants';

interface MusicFiltersProps {
  filters: MultiTrackFilters;
  onChange: (filters: MultiTrackFilters) => void;
  totalResults: number;
}

export const MusicFilters: React.FC<MusicFiltersProps> = ({ filters, onChange, totalResults }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'genres' | 'moods' | 'languages' | 'decades' | 'occasions' | 'tags' | 'metrics'>('genres');

  const toggleArrayItem = (key: keyof MultiTrackFilters, item: string) => {
    const currentList = (filters[key] as string[]) || [];
    const exists = currentList.includes(item);
    const updated = exists ? currentList.filter((i) => i !== item) : [...currentList, item];
    onChange({ ...filters, [key]: updated });
  };

  const clearAllFilters = () => {
    onChange({
      searchQuery: filters.searchQuery || '',
      genres: [],
      moods: [],
      languages: [],
      decades: [],
      occasions: [],
      tags: [],
      minEnergy: undefined,
      maxEnergy: undefined,
      minRelax: undefined,
      maxRelax: undefined,
      minFocus: undefined,
      maxFocus: undefined,
      minDance: undefined,
      maxDance: undefined,
      onlyFavorites: false,
    });
  };

  // Count total active filters
  const activeFiltersCount =
    (filters.genres?.length || 0) +
    (filters.moods?.length || 0) +
    (filters.languages?.length || 0) +
    (filters.decades?.length || 0) +
    (filters.occasions?.length || 0) +
    (filters.tags?.length || 0) +
    (filters.minEnergy !== undefined ? 1 : 0) +
    (filters.minRelax !== undefined ? 1 : 0) +
    (filters.minFocus !== undefined ? 1 : 0) +
    (filters.minDance !== undefined ? 1 : 0) +
    (filters.onlyFavorites ? 1 : 0);

  return (
    <div className="w-full flex flex-col gap-3 bg-brand-surface/80 backdrop-blur-xl border border-brand-border/60 rounded-2xl p-4 shadow-xl mb-6">
      {/* Search Input & Expand Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
          <input
            type="text"
            placeholder="Buscar por título, artista, gênero, tag ou notas..."
            value={filters.searchQuery || ''}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-brand-border/60 rounded-xl text-sm text-white placeholder:text-brand-text-muted focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onChange({ ...filters, searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={() => onChange({ ...filters, onlyFavorites: !filters.onlyFavorites })}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              filters.onlyFavorites
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/10'
                : 'bg-black/20 text-brand-text-muted border-brand-border/60 hover:border-white/20 hover:text-white'
            }`}
          >
            ★ Favoritas
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
              activeFiltersCount > 0 || isExpanded
                ? 'bg-brand-purple text-white border-brand-purple shadow-lg shadow-brand-purple/20'
                : 'bg-black/30 text-brand-text border-brand-border/60 hover:border-brand-purple/50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtros Avançados</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand-cyan text-brand-dark text-3xs font-extrabold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              title="Limpar todos os filtros"
              className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips Bar (When Collapsed) */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-brand-border/30">
          <span className="text-3xs font-black uppercase tracking-wider text-brand-text-muted">
            Filtros ativos ({totalResults} músicas):
          </span>

          {filters.genres?.map((g) => (
            <span
              key={`g-${g}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-semibold bg-brand-purple/20 text-brand-purple border border-brand-purple/40"
            >
              🎵 {g}
              <button onClick={() => toggleArrayItem('genres', g)} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {filters.moods?.map((m) => (
            <span
              key={`m-${m}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-semibold bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40"
            >
              ✨ {m}
              <button onClick={() => toggleArrayItem('moods', m)} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {filters.languages?.map((l) => (
            <span
              key={`l-${l}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40"
            >
              {getLanguageIcon(l)} {l}
              <button onClick={() => toggleArrayItem('languages', l)} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {filters.decades?.map((d) => (
            <span
              key={`d-${d}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
            >
              📅 {formatDecadeLabel(d)}
              <button onClick={() => toggleArrayItem('decades', d)} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {filters.occasions?.map((o) => (
            <span
              key={`o-${o}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40"
            >
              🚗 {o}
              <button onClick={() => toggleArrayItem('occasions', o)} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {filters.tags?.map((t) => (
            <span
              key={`t-${t}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/40"
            >
              🏷️ #{t}
              <button onClick={() => toggleArrayItem('tags', t)} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {filters.minEnergy !== undefined && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-semibold bg-red-500/20 text-red-300 border border-red-500/40">
              🔥 Energia &ge; {filters.minEnergy}%
              <button onClick={() => onChange({ ...filters, minEnergy: undefined })} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.minFocus !== undefined && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-2xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              🎯 Foco &ge; {filters.minFocus}%
              <button onClick={() => onChange({ ...filters, minFocus: undefined })} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={clearAllFilters}
            className="text-3xs font-bold text-red-400 hover:underline cursor-pointer ml-auto"
          >
            Limpar Filtros
          </button>
        </div>
      )}

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <div className="pt-3 border-t border-brand-border/40 flex flex-col gap-4 animate-fadeIn">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveTab('genres')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'genres'
                  ? 'bg-brand-purple/20 text-white border border-brand-purple/60'
                  : 'text-brand-text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              🎵 Gêneros ({filters.genres?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('moods')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'moods'
                  ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/60'
                  : 'text-brand-text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              ✨ Moods ({filters.moods?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('languages')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'languages'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/60'
                  : 'text-brand-text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              🌐 Idiomas ({filters.languages?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('decades')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'decades'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60'
                  : 'text-brand-text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              📅 Décadas ({filters.decades?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('occasions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'occasions'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60'
                  : 'text-brand-text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              🚗 Ocasiões ({filters.occasions?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('tags')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'tags'
                  ? 'bg-pink-500/20 text-pink-300 border border-pink-500/60'
                  : 'text-brand-text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              🏷️ Tags ({filters.tags?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'metrics'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/60'
                  : 'text-brand-text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              ⚡ Métricas & Níveis
            </button>
          </div>

          {/* Tab Contents */}
          <div className="p-3 bg-black/30 rounded-xl border border-brand-border/40">
            {activeTab === 'genres' && (
              <div className="flex flex-wrap gap-2">
                {GENRE_OPTIONS.map((genre) => {
                  const isSelected = filters.genres?.includes(genre);
                  return (
                    <button
                      key={genre}
                      onClick={() => toggleArrayItem('genres', genre)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-brand-purple text-white border-brand-purple shadow-md shadow-brand-purple/20'
                          : 'bg-white/5 text-brand-text-muted border-brand-border/40 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'moods' && (
              <div className="flex flex-wrap gap-2">
                {MOOD_OPTIONS.map((mood) => {
                  const isSelected = filters.moods?.includes(mood);
                  return (
                    <button
                      key={mood}
                      onClick={() => toggleArrayItem('moods', mood)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-brand-cyan text-brand-dark font-bold border-brand-cyan shadow-md shadow-brand-cyan/20'
                          : 'bg-white/5 text-brand-text-muted border-brand-border/40 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      ✨ {mood}
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'languages' && (
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((lang) => {
                  const isSelected = filters.languages?.includes(lang);
                  return (
                    <button
                      key={lang}
                      onClick={() => toggleArrayItem('languages', lang)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                          : 'bg-white/5 text-brand-text-muted border-brand-border/40 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {getLanguageIcon(lang)} {lang}
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'decades' && (
              <div className="flex flex-wrap gap-2">
                {DECADE_OPTIONS.map((decade) => {
                  const isSelected = filters.decades?.includes(decade);
                  return (
                    <button
                      key={decade}
                      onClick={() => toggleArrayItem('decades', decade)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                          : 'bg-white/5 text-brand-text-muted border-brand-border/40 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {formatDecadeLabel(decade)}
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'occasions' && (
              <div className="flex flex-wrap gap-2">
                {OCCASION_OPTIONS.map((occ) => {
                  const isSelected = filters.occasions?.includes(occ);
                  return (
                    <button
                      key={occ}
                      onClick={() => toggleArrayItem('occasions', occ)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/20'
                          : 'bg-white/5 text-brand-text-muted border-brand-border/40 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      🚗 {occ}
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'tags' && (
              <div className="flex flex-wrap gap-2">
                {TAG_PRESETS.map((tag) => {
                  const isSelected = filters.tags?.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleArrayItem('tags', tag)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-500/20'
                          : 'bg-white/5 text-brand-text-muted border-brand-border/40 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Energy Level Filter */}
                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                      🔥 Nível de Energia Mínimo
                    </span>
                    <span className="text-xs font-black text-white">
                      {filters.minEnergy !== undefined ? `${filters.minEnergy}%` : 'Qualquer'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={filters.minEnergy ?? 0}
                    onChange={(e) =>
                      onChange({ ...filters, minEnergy: Number(e.target.value) === 0 ? undefined : Number(e.target.value) })
                    }
                    className="w-full accent-red-500 cursor-pointer"
                  />
                </div>

                {/* Focus Level Filter */}
                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                      🎯 Nível de Foco Mínimo
                    </span>
                    <span className="text-xs font-black text-white">
                      {filters.minFocus !== undefined ? `${filters.minFocus}%` : 'Qualquer'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={filters.minFocus ?? 0}
                    onChange={(e) =>
                      onChange({ ...filters, minFocus: Number(e.target.value) === 0 ? undefined : Number(e.target.value) })
                    }
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Relax Level Filter */}
                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      🌿 Nível de Relaxamento Mínimo
                    </span>
                    <span className="text-xs font-black text-white">
                      {filters.minRelax !== undefined ? `${filters.minRelax}%` : 'Qualquer'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={filters.minRelax ?? 0}
                    onChange={(e) =>
                      onChange({ ...filters, minRelax: Number(e.target.value) === 0 ? undefined : Number(e.target.value) })
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Dance Level Filter */}
                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-pink-400 flex items-center gap-1">
                      💃 Nível de Dança Mínimo
                    </span>
                    <span className="text-xs font-black text-white">
                      {filters.minDance !== undefined ? `${filters.minDance}%` : 'Qualquer'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={filters.minDance ?? 0}
                    onChange={(e) =>
                      onChange({ ...filters, minDance: Number(e.target.value) === 0 ? undefined : Number(e.target.value) })
                    }
                    className="w-full accent-pink-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
