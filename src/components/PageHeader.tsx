import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actionSlot?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actionSlot,
  className = '',
}) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-brand-border ${className}`}>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-extrabold font-display text-brand-text tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-brand-text-muted max-w-xl font-medium leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actionSlot && <div className="flex items-center gap-3 shrink-0">{actionSlot}</div>}
    </div>
  );
};
