import React, { useState, useEffect } from 'react';
import { Play, Heart, Download, Check, Loader2, Star, Music, Radio } from 'lucide-react';
import { Track, Profile } from '../types';
import { usePlayer, usePlaylist } from '../hooks';
import { TrackOptionsMenu } from './player/TrackOptionsMenu';
import { getYoutubeThumbnail } from '../utils/youtube';
import { downloadManager } from '../core/download';

interface TrackCardProps {
  track: Track;
  layoutTracks?: Track[];
  viewMode?: 'grid' | 'list';
  profiles?: Profile[];
  onOpenPlaylistPicker?: (trackId: string) => void;
  onEdit?: (track: Track) => void;
  onDelete?: (trackId: string, trackTitle: string) => void;
  onDownload?: (track: Track) => void;
  onRemoveFromPlaylist?: (trackId: string, trackTitle: string) => void;
}

const formatSeconds = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  layoutTracks,
  viewMode = 'grid',
  profiles = [],
  onOpenPlaylistPicker,
  onEdit,
  onDelete,
  onDownload,
  onRemoveFromPlaylist,
}) => {
  const { currentTrack, isPlaying, playTrack } = usePlayer();
  const { toggleFavoriteTrack, updateTrackRating } = usePlaylist();

  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const unsubscribe = downloadManager.subscribe((tasks) => {
      const task = tasks.get(track.id);
      if (task) {
        setIsDownloading(
          task.status === 'Downloading' ||
            task.status === 'Processing' ||
            task.status === 'Preparing' ||
            task.status === 'Importing' ||
            task.status === 'Waiting'
        );
      } else {
        setIsDownloading(false);
      }
    });
    return unsubscribe;
  }, [track.id]);

  const isCurrent = currentTrack?.id === track.id;
  const isLocal = track.source?.type === 'local';
  const trackFav = track.favorite || false;
  const trackThumbnail = track.thumbnail || getYoutubeThumbnail(track.youtubeId);
  const trackDuration = formatSeconds(track.duration || 210);
  const adderProfile = profiles.find((p) => p.id === track.addedBy);

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLocal) return; // Disables download if already local
    if (onDownload) {
      onDownload(track);
    }
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => playTrack(track, layoutTracks)}
        onTouchEnd={(e) => {
          // Prevent ghost clicks on mobile
          e.preventDefault();
          playTrack(track, layoutTracks);
        }}
        className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 group cursor-pointer active:scale-[0.98] active:bg-brand-purple/10 ${
          isCurrent
            ? 'bg-brand-purple/15 border-brand-purple/50 shadow-lg shadow-brand-purple/10'
            : 'bg-brand-card/40 border-brand-border/60 hover:bg-brand-card/70 hover:border-brand-purple/40'
        }`}
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Thumbnail & Play */}
          <div
            className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl overflow-hidden bg-black border border-brand-border/80 flex items-center justify-center shrink-0 relative group-hover:scale-105 transition-transform duration-200"
          >
            <img src={trackThumbnail} alt={track.title} className="w-full h-full object-cover opacity-75" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              {isCurrent && isPlaying ? (
                <span className="flex gap-0.5 items-end justify-center">
                  <span className="w-1 bg-brand-cyan h-3 rounded-full animate-bounce" />
                  <span className="w-1 bg-brand-cyan h-4 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1 bg-brand-cyan h-2 rounded-full animate-bounce [animation-delay:0.3s]" />
                </span>
              ) : (
                <Play className="w-4 h-4 fill-white text-white ml-0.5" />
              )}
            </div>
          </div>

          {/* Track Info */}
          <div className="min-w-0 flex-1 pr-2">
            <h4
              className={`text-sm font-extrabold truncate flex items-center gap-1.5 ${
                isCurrent ? 'text-brand-purple-light' : 'text-white'
              }`}
            >
              <span className="truncate">{track.title}</span>
            </h4>
            <p className="text-2xs text-brand-text-muted truncate mt-0.5 font-medium">{track.artist}</p>
          </div>

          {/* Genre Tag */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <span className="text-3xs font-extrabold px-2.5 py-0.5 rounded-full bg-brand-purple/20 text-brand-purple-light border border-brand-purple/30">
              {track.genre || 'Geral'}
            </span>
          </div>
        </div>

          {/* Actions & Download Status */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-2xs font-mono font-semibold text-brand-text-muted hidden md:inline mr-1">
            {trackDuration}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavoriteTrack(track.id);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              toggleFavoriteTrack(track.id);
            }}
            className={`p-2 min-w-[40px] min-h-[40px] rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
              trackFav
                ? 'bg-red-500/20 border-red-500/40 text-red-500'
                : 'bg-black/30 border-white/10 text-white/50 hover:text-white'
            }`}
            title={trackFav ? 'Remover dos Favoritos' : 'Favoritar'}
          >
            <Heart className={`w-4 h-4 ${trackFav ? 'fill-red-500' : ''}`} />
          </button>

          {/* Download Button Aware of State */}
          {isLocal ? (
            <span
              className="px-2.5 py-1.5 min-h-[36px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-3xs font-black flex items-center gap-1 shrink-0 select-none"
              title="Disponível Offline"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Offline</span>
            </span>
          ) : isDownloading ? (
            <span
              className="px-2.5 py-1.5 min-h-[36px] bg-brand-purple/30 text-brand-purple-light border border-brand-purple/50 rounded-xl text-3xs font-bold flex items-center gap-1 shrink-0"
              title="Baixando..."
            >
              <Loader2 className="w-4 h-4 animate-spin text-brand-cyan" />
              <span className="hidden sm:inline">Baixando</span>
            </span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadClick(e);
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                handleDownloadClick(e as unknown as React.MouseEvent);
              }}
              className="px-2.5 py-1.5 min-h-[36px] bg-brand-purple/20 hover:bg-brand-purple/40 border border-brand-purple/40 text-brand-purple-light hover:text-white rounded-xl text-3xs font-extrabold flex items-center gap-1 transition-all cursor-pointer shrink-0"
              title="Baixar para ouvir offline"
            >
              <Download className="w-4 h-4 text-brand-purple-light" />
              <span className="hidden sm:inline">Download</span>
            </button>
          )}

          <TrackOptionsMenu
            track={track}
            onOpenPlaylistPicker={onOpenPlaylistPicker}
            onEdit={onEdit}
            onDelete={onDelete}
            onDownload={onDownload}
            onRemoveFromPlaylist={onRemoveFromPlaylist}
            size="sm"
          />
        </div>
      </div>
    );
  }

  // Grid Layout Card
  return (
    <div
      className={`flex flex-col h-full rounded-2xl p-3.5 border backdrop-blur-md transition-all duration-300 group relative justify-between ${
        isCurrent
          ? 'bg-brand-purple/15 border-brand-purple/50 shadow-xl shadow-brand-purple/10'
          : 'bg-brand-card/40 border-brand-border/60 hover:bg-brand-card/80 hover:border-brand-purple/40'
      }`}
    >
      {/* Thumbnail Container */}
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black relative group-hover:scale-[1.01] transition-transform duration-300 shrink-0">
        <img
          src={trackThumbnail}
          alt={track.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />

        {/* Play Button Overlay - Always visible on mobile, hover on desktop */}
        <div className="absolute inset-0 bg-black/40 sm:bg-black/50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button
            onClick={() => playTrack(track, layoutTracks)}
            onTouchEnd={(e) => {
              e.preventDefault();
              playTrack(track, layoutTracks);
            }}
            className="w-14 h-14 min-w-[56px] min-h-[56px] rounded-full bg-brand-purple text-white flex items-center justify-center sm:transform sm:scale-90 sm:group-hover:scale-100 transition-all duration-300 cursor-pointer shadow-lg hover:bg-brand-cyan hover:text-black active:scale-95"
          >
            {isCurrent && isPlaying ? (
              <span className="flex gap-1 items-end justify-center">
                <span className="w-1.5 bg-white h-4 rounded-full animate-bounce" />
                <span className="w-1.5 bg-white h-5.5 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 bg-white h-3 rounded-full animate-bounce [animation-delay:0.3s]" />
              </span>
            ) : (
              <Play className="w-7 h-7 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Duration Badge */}
        <span className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded-md text-3xs font-mono font-extrabold text-white">
          {trackDuration}
        </span>

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10">
          <span className="bg-brand-purple/80 border border-brand-purple/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-3xs font-black text-white">
            {track.genre || 'Geral'}
          </span>
          {isLocal && (
            <span className="bg-emerald-600/90 border border-emerald-400/60 backdrop-blur-md px-2 py-0.5 rounded-full text-3xs font-black text-white flex items-center gap-1 shadow-md">
              💾 MP3 Local
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavoriteTrack(track.id);
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            toggleFavoriteTrack(track.id);
          }}
          className={`absolute top-2 right-2 p-2.5 min-w-[40px] min-h-[40px] rounded-full backdrop-blur-md border cursor-pointer transition-all hover:scale-110 z-10 flex items-center justify-center ${
            trackFav
              ? 'bg-red-500/20 border-red-500/50 text-red-500'
              : 'bg-black/60 border-white/10 text-white/70 hover:text-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${trackFav ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      {/* Body Info */}
      <div className="flex flex-col gap-2 mt-3 flex-1 justify-between">
        <div>
          <h3
            className={`text-sm font-black truncate leading-tight group-hover:text-brand-purple-light transition-colors ${
              isCurrent ? 'text-brand-purple-light' : 'text-white'
            }`}
            title={track.title}
          >
            {track.title}
          </h3>
          <p className="text-2xs text-brand-text-muted truncate mt-0.5 font-medium" title={track.artist}>
            {track.artist}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-brand-border/40 pt-2.5 flex items-center justify-between gap-2 mt-1">
          {adderProfile ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs select-none">{adderProfile.avatar}</span>
              <span className="text-3xs font-bold text-white truncate max-w-[80px]">
                {adderProfile.name}
              </span>
            </div>
          ) : (
            <span className="text-3xs text-brand-text-muted font-bold truncate">
              {track.timesPlayed || track.playsCount || 0} tocadas
            </span>
          )}

          {/* Download Button + Options Menu */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isLocal ? (
              <span
                className="px-2 py-1 min-h-[34px] rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-3xs font-black flex items-center gap-1 cursor-default select-none"
                title="Faixa disponível offline"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Offline
              </span>
            ) : isDownloading ? (
              <span
                className="px-2 py-1 min-h-[34px] rounded-lg bg-brand-purple/30 text-brand-purple-light border border-brand-purple/50 text-3xs font-bold flex items-center gap-1"
                title="Baixando..."
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-cyan" /> Baixando
              </span>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadClick(e);
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  handleDownloadClick(e as unknown as React.MouseEvent);
                }}
                className="px-2 py-1.5 min-h-[34px] bg-brand-purple/20 hover:bg-brand-purple/40 border border-brand-purple/40 text-brand-purple-light hover:text-white rounded-lg text-3xs font-extrabold flex items-center gap-1 transition-all cursor-pointer"
                title="Baixar para ouvir offline"
              >
                <Download className="w-3.5 h-3.5 text-brand-purple-light" /> Download
              </button>
            )}

            <TrackOptionsMenu
              track={track}
              onOpenPlaylistPicker={onOpenPlaylistPicker}
              onEdit={onEdit}
              onDelete={onDelete}
              onDownload={onDownload}
              onRemoveFromPlaylist={onRemoveFromPlaylist}
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
