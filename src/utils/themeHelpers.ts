import { NeonThemeMode } from '../contexts/ThemeContext';

export interface ThemeColors {
  primaryBg: string;
  hoverBg: string;
  text: string;
  border: string;
  glow: string;
  badge: string;
  gradient: string;
}

export const getThemeColors = (mode: NeonThemeMode): ThemeColors => {
  switch (mode) {
    case 'blue':
      return {
        primaryBg: 'bg-brand-blue',
        hoverBg: 'hover:bg-cyan-500',
        text: 'text-brand-blue',
        border: 'border-brand-blue/30',
        glow: 'shadow-[0_0_15px_rgba(0,180,216,0.3)]',
        badge: 'bg-brand-blue/10 text-brand-blue border-brand-blue/30',
        gradient: 'from-brand-blue to-cyan-500',
      };
    case 'cyan':
      return {
        primaryBg: 'bg-brand-cyan',
        hoverBg: 'hover:bg-emerald-500',
        text: 'text-brand-cyan',
        border: 'border-brand-cyan/30',
        glow: 'shadow-[0_0_15px_rgba(6,214,160,0.3)]',
        badge: 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30',
        gradient: 'from-brand-cyan to-emerald-500',
      };
    case 'pink':
      return {
        primaryBg: 'bg-brand-pink',
        hoverBg: 'hover:bg-rose-500',
        text: 'text-brand-pink',
        border: 'border-brand-pink/30',
        glow: 'shadow-[0_0_15px_rgba(255,0,127,0.3)]',
        badge: 'bg-brand-pink/10 text-brand-pink border-brand-pink/30',
        gradient: 'from-brand-pink to-rose-500',
      };
    case 'purple':
    default:
      return {
        primaryBg: 'bg-brand-purple',
        hoverBg: 'hover:bg-brand-purple-light',
        text: 'text-brand-purple-light',
        border: 'border-brand-purple/30',
        glow: 'shadow-[0_0_15px_rgba(123,44,191,0.3)]',
        badge: 'bg-brand-purple/10 text-brand-purple-light border-brand-purple/30',
        gradient: 'from-brand-purple to-brand-purple-light',
      };
  }
};
