import React, { useRef, useCallback } from 'react';
import { usePlayer } from '../../hooks';

export const ProgressBar: React.FC = () => {
  const { currentTrack, progress, duration, setProgress } = usePlayer();
  const barRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === undefined) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentDuration = duration || currentTrack?.duration || 0;
  const progressPercent = currentDuration > 0 ? (progress / currentDuration) * 100 : 0;

  const seekFromEvent = useCallback((clientX: number) => {
    if (!barRef.current || currentDuration === 0) return;
    const rect = barRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const width = rect.width;
    const clickPercent = Math.max(0, Math.min(1, clickX / width));
    setProgress(clickPercent * currentDuration);
  }, [currentDuration, setProgress]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    seekFromEvent(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    seekFromEvent(e.clientX);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  // Touch-specific handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    seekFromEvent(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    e.preventDefault(); // Prevent scroll while seeking
    seekFromEvent(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  return (
    <div className="flex items-center gap-3 w-full text-3xs font-black tracking-wider text-brand-text-muted select-none font-mono">
      <span className="min-w-[36px] text-right">{formatTime(progress)}</span>
      <div
        ref={barRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 h-3 min-h-[44px] flex items-center cursor-pointer group touch-none"
      >
        <div className="w-full h-2 rounded-full bg-brand-surface border border-brand-border/40 relative transition-all duration-200 group-hover:h-2.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-pink relative transition-[width] duration-75"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Subtle glow overlay */}
            <div className="absolute inset-0 bg-white/10 rounded-full" />
          </div>
          
          {/* Playhead thumb - always visible on mobile */}
          <div
            className="absolute w-4 h-4 rounded-full bg-white border-2 border-brand-purple top-1/2 -translate-y-1/2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 shadow-md shadow-brand-purple/40 pointer-events-none"
            style={{ left: `calc(${progressPercent}% - 8px)` }}
          />
        </div>
      </div>
      <span className="min-w-[36px]">{formatTime(currentDuration)}</span>
    </div>
  );
};
