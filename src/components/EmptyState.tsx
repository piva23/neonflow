import React from 'react';
import { Music } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onActionClick?: () => void;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onActionClick,
  action,
  icon,
  className = '',
}) => {
  const renderedIcon: React.ReactNode = icon || <Music className="w-8 h-8 text-brand-purple-light" />;

  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 md:p-12 glass-panel rounded-2xl border border-brand-border/40 ${className}`}>
      <div className="w-16 h-16 rounded-full bg-brand-surface/80 border border-brand-border flex items-center justify-center text-brand-purple-light mb-4 shadow-inner">
        {renderedIcon}
      </div>
      <h3 className="text-lg font-bold text-brand-text mb-1 tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-brand-text-muted max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action ? (
        action
      ) : actionLabel && onActionClick ? (
        <Button onClick={onActionClick} variant="primary" glow>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
};
