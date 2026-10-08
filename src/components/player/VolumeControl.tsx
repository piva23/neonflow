import React, { useRef } from 'react';
import { Volume2, Volume1, VolumeX, Volume } from 'lucide-react';
import { usePlayer, useTheme } from '../../hooks';

export const VolumeControl: React.FC = () => {
  const { volume, setVolume } = usePlayer();
  const { activeTheme } = useTheme();
  const previousVolumeRef = useRef<number>(80);

  const handleToggleMute = () => {
    if (volume > 0) {
      previousVolumeRef.current = volume;
      setVolume(0);
    } else {
      setVolume(previousVolumeRef.current || 80);
    }
  };

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX className="w-4.5 h-4.5 text-red-500" />;
    if (volume < 30) return <Volume className="w-4.5 h-4.5 text-brand-text-muted" />;
    if (volume < 70) return <Volume1 className="w-4.5 h-4.5 text-brand-text" />;
    return <Volume2 className="w-4.5 h-4.5 text-brand-purple-light" />;
  };

  const accentColor = activeTheme === 'blue' ? '#00b4d8' : activeTheme === 'cyan' ? '#06d6a0' : activeTheme === 'pink' ? '#ff007f' : '#7b2cbf';

  return (
    <div className="flex items-center gap-2.5 text-brand-text-muted shrink-0 select-none">
      <button
        onClick={handleToggleMute}
        className="p-2 min-w-[40px] min-h-[40px] rounded-xl hover:bg-white/5 hover:text-white transition-all cursor-pointer flex items-center justify-center active:scale-90"
        title={volume === 0 ? 'Ativar Som' : 'Mudar para Mudo'}
      >
        {getVolumeIcon()}
      </button>
      <input
        type="range"
        min="0"
        max="100"
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        className="w-16 md:w-24 h-2 min-h-[44px] bg-transparent border-none rounded-lg appearance-none cursor-pointer accent-brand-purple"
        style={{ accentColor }}
      />
      <span className="text-3xs font-mono font-extrabold w-7 text-right text-brand-text-muted/80">{volume}%</span>
    </div>
  );
};
