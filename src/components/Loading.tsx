import React from 'react';
import { Disc } from 'lucide-react';
import { useTheme } from '../hooks';
import { getThemeColors } from '../utils/themeHelpers';

interface LoadingProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Carregando biblioteca...',
  className = '',
  size = 'md',
}) => {
  const { activeTheme } = useTheme();
  const themeColors = getThemeColors(activeTheme);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 gap-4 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Outer Pulsing Glow */}
        <div className={`absolute inset-0 rounded-full blur-xl opacity-30 animate-pulse ${themeColors.primaryBg}`} />
        
        {/* Spinning Disk Icon */}
        <Disc className={`animate-spin text-brand-text ${sizeClasses[size]} ${themeColors.text}`} />
      </div>
      {message && (
        <span className="text-xs font-semibold text-brand-text-muted uppercase tracking-widest animate-pulse">
          {message}
        </span>
      )}
    </div>
  );
};
