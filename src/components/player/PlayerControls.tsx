import React from 'react';
import { Play, Pause, Square, SkipForward, SkipBack, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { usePlayer } from '../../hooks';
import { getThemeColors } from '../../utils/themeHelpers';
import { useTheme } from '../../hooks';

interface PlayerControlsProps {
  size?: 'sm' | 'md' | 'lg';
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({ size = 'md' }) => {
  const { isPlaying, togglePlay, stopTrack, nextTrack, prevTrack, shuffleMode, toggleShuffle, repeatMode, toggleRepeat, currentTrack } = usePlayer();
  const { activeTheme } = useTheme();
  const themeColors = getThemeColors(activeTheme);

  const btnSizes = {
    sm: { play: 'w-10 h-10 min-w-[44px] min-h-[44px]', playIcon: 'w-4 h-4', stop: 'w-9 h-9 min-w-[40px] min-h-[40px]', stopIcon: 'w-3.5 h-3.5', skip: 'w-5 h-5', other: 'w-4 h-4', padding: 'p-2 min-w-[40px] min-h-[40px]' },
    md: { play: 'w-12 h-12 min-w-[48px] min-h-[48px]', playIcon: 'w-5 h-5', stop: 'w-10 h-10 min-w-[44px] min-h-[44px]', stopIcon: 'w-4 h-4', skip: 'w-5 h-5', other: 'w-5 h-5', padding: 'p-2.5 min-w-[44px] min-h-[44px]' },
    lg: { play: 'w-16 h-16 min-w-[64px] min-h-[64px]', playIcon: 'w-7 h-7', stop: 'w-12 h-12 min-w-[48px] min-h-[48px]', stopIcon: 'w-5 h-5', skip: 'w-6 h-6', other: 'w-5.5 h-5.5', padding: 'p-3 min-w-[48px] min-h-[48px]' },
  };

  const selectedSize = btnSizes[size];

  const getRepeatIcon = () => {
    if (repeatMode === 'one') {
      return <Repeat1 className={selectedSize.other} />;
    }
    return <Repeat className={selectedSize.other} />;
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 shrink-0 select-none">
      {/* Shuffle Mode */}
      <button
        onClick={toggleShuffle}
        disabled={!currentTrack}
        className={`rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-90 flex items-center justify-center ${
          selectedSize.padding
        } ${
          shuffleMode
            ? 'text-brand-purple-light hover:text-brand-purple-light/80 drop-shadow-[0_0_8px_rgba(123,44,191,0.5)]'
            : 'text-brand-text-muted hover:text-brand-text'
        }`}
        title={`Modo Aleatório: ${shuffleMode ? 'Ativo' : 'Desativado'}`}
      >
        <Shuffle className={selectedSize.other} />
      </button>

      {/* Previous Track */}
      <button
        onClick={prevTrack}
        disabled={!currentTrack}
        className={`rounded-xl text-brand-text-muted hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 active:scale-90 flex items-center justify-center ${selectedSize.padding}`}
        title="Anterior (Voltar)"
      >
        <SkipBack className={selectedSize.skip} />
      </button>

      {/* Play / Pause Toggle Button */}
      <button
        onClick={togglePlay}
        disabled={!currentTrack}
        className={`rounded-full flex items-center justify-center text-white cursor-pointer transition-all duration-300 disabled:opacity-35 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-md ${
          themeColors.primaryBg} ${themeColors.glow} ${selectedSize.play}
        `}
        title={isPlaying ? 'Pausar' : 'Tocar'}
      >
        {isPlaying ? (
          <Pause className={`${selectedSize.playIcon} fill-white`} />
        ) : (
          <Play className={`${selectedSize.playIcon} fill-white ml-0.5`} />
        )}
      </button>

      {/* Stop Button */}
      <button
        onClick={stopTrack}
        disabled={!currentTrack}
        className={`rounded-full flex items-center justify-center bg-white/10 hover:bg-red-500/30 text-brand-text-muted hover:text-red-400 border border-white/10 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-90 ${selectedSize.stop}`}
        title="Parar Reprodução (Stop)"
      >
        <Square className={`${selectedSize.stopIcon} fill-current`} />
      </button>

      {/* Next Track */}
      <button
        onClick={nextTrack}
        disabled={!currentTrack}
        className={`rounded-xl text-brand-text-muted hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 active:scale-90 flex items-center justify-center ${selectedSize.padding}`}
        title="Próxima"
      >
        <SkipForward className={selectedSize.skip} />
      </button>

      {/* Repeat Mode */}
      <button
        onClick={toggleRepeat}
        disabled={!currentTrack}
        className={`rounded-xl transition-all cursor-pointer relative disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-90 flex items-center justify-center ${
          selectedSize.padding
        } ${
          repeatMode !== 'none'
            ? 'text-brand-purple-light hover:text-brand-purple-light/80 drop-shadow-[0_0_8px_rgba(123,44,191,0.5)]'
            : 'text-brand-text-muted hover:text-brand-text'
        }`}
        title={`Modo Repetir: ${
          repeatMode === 'none' ? 'Desativado' : repeatMode === 'all' ? 'Repetir Fila Completa' : 'Repetir Música Atual'
        }`}
      >
        {getRepeatIcon()}
        {repeatMode !== 'none' && (
          <span className="absolute bottom-1 left-1/2 -translate-y-[2px] -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand-purple-light animate-pulse" />
        )}
      </button>
    </div>
  );
};
