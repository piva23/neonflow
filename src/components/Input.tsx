import React from 'react';
import { useTheme } from '../hooks';
import { getThemeColors } from '../utils/themeHelpers';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon,
  error,
  className = '',
  id,
  ...props
}) => {
  const { activeTheme } = useTheme();
  const themeColors = getThemeColors(activeTheme);

  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  let renderedIcon: React.ReactNode = icon;
  if (
    typeof renderedIcon === 'function' ||
    (typeof renderedIcon === 'object' && renderedIcon !== null && 'render' in renderedIcon)
  ) {
    const IconComponent = renderedIcon as unknown as React.ElementType;
    renderedIcon = <IconComponent className="w-4 h-4 text-brand-text-muted" />;
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-brand-text-muted">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {renderedIcon && (
          <div className="absolute left-3.5 text-brand-text-muted pointer-events-none flex items-center justify-center">
            {renderedIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`glass-input w-full rounded-xl py-3 px-4 text-sm font-medium leading-relaxed transition-all duration-200
            ${icon ? 'pl-11' : ''}
            ${error ? 'border-red-500/40 focus:border-red-500 focus:ring-red-500/20' : `focus:border-${themeColors.text} focus:ring-brand-purple/25`}
            ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-red-400 font-medium">{error}</span>}
    </div>
  );
};
