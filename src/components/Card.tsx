import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'flat' | 'outline' | 'gradient';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  variant = 'flat',
}) => {
  const clickableClass = onClick ? 'cursor-pointer hover:bg-brand-surface/70 transition-colors duration-200' : '';

  const variantClasses = {
    flat: 'bg-brand-card/95 border border-brand-border',
    outline: 'bg-transparent border-2 border-brand-border',
    gradient: 'bg-gradient-to-br from-brand-card to-brand-bg border border-brand-border',
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-5 ${variantClasses[variant]} ${clickableClass} ${className}`}
    >
      {children}
    </div>
  );
};
