import React from 'react';
import { useTheme } from '../hooks';
import { getThemeColors } from '../utils/themeHelpers';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'danger' | 'ghost' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  glow = false,
  className = '',
  disabled,
  ...props
}) => {
  const { activeTheme, glowEnabled } = useTheme();
  const themeColors = getThemeColors(activeTheme);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-medium rounded-lg',
    md: 'px-4 py-2 text-sm font-medium rounded-xl',
    lg: 'px-6 py-3 text-base font-semibold rounded-2xl',
  };

  const variantClasses = {
    primary: `${themeColors.primaryBg} text-white ${themeColors.hoverBg} transition-all duration-300`,
    secondary: 'bg-brand-surface text-brand-text border border-brand-border hover:bg-brand-surface/80 hover:border-brand-text/20 transition-all duration-300',
    glass: 'glass-card text-brand-text hover:text-white transition-all duration-300',
    danger: 'bg-red-600 text-white hover:bg-red-500 transition-all duration-300 shadow-md shadow-red-900/10',
    ghost: 'text-brand-text-muted hover:text-white hover:bg-white/5 transition-all duration-300',
    glow: `${themeColors.primaryBg} text-white ${themeColors.hoverBg} transition-all duration-300`,
  };

  // Combine styles
  const isGlowing = glow && glowEnabled && variant === 'primary';
  const glowClass = isGlowing ? themeColors.glow : '';
  const opacityClass = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      disabled={disabled}
      className={`relative inline-flex items-center justify-center gap-2 overflow-hidden border-0 tracking-wide select-none ${sizeClasses[size]} ${variantClasses[variant]} ${glowClass} ${opacityClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
