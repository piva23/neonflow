import React from 'react';
import { useTheme } from '../hooks';
import { getThemeColors } from '../utils/themeHelpers';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  className = '',
}) => {
  const { activeTheme } = useTheme();
  const themeColors = getThemeColors(activeTheme);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {subtitle && (
        <span className={`text-[10px] font-bold uppercase tracking-widest ${themeColors.text}`}>
          {subtitle}
        </span>
      )}
      <h2 className="text-xl md:text-2xl font-bold font-display text-brand-text tracking-tight">
        {title}
      </h2>
    </div>
  );
};
