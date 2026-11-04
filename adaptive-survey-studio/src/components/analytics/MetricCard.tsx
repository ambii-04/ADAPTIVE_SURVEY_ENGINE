import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  badge?: string;
}

export function MetricCard({ label, value, subtext, icon, badge }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        {icon && <div className="text-slate-400 p-1.5 bg-slate-50 rounded-lg">{icon}</div>}
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            {value}
          </span>
          {badge && (
            <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
              {badge}
            </span>
          )}
        </div>
        {subtext && (
          <p className="text-xs text-slate-500 mt-1 truncate">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}
