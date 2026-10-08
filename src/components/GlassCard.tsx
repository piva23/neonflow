import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = true,
}) => {
  const clickableClass = onClick ? 'cursor-pointer' : '';
  const hoverClass = hoverable
    ? 'hover:bg-brand-surface/40 hover:border-brand-purple/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:-translate-y-0.5'
    : '';

  return (
    <div
      onClick={onClick}
      className={`glass-panel rounded-2xl p-5 border border-brand-border transition-all duration-300 ${clickableClass} ${hoverClass} ${className}`}
    >
      {children}
    </div>
  );
};
