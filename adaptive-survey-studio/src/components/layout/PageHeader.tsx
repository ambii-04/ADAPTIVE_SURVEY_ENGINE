import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  kicker?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, kicker, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-6">
      <div className="min-w-0">
        {kicker && (
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-1">
            {kicker}
          </p>
        )}
        <h1 className="text-xl font-bold tracking-tight text-slate-900 truncate">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}
