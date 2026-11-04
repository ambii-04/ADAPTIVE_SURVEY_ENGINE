import { SessionDimensionCoverage } from '../../types/analytics';

interface CoverageChartProps {
  coverage: SessionDimensionCoverage[];
  title?: string;
  subtitle?: string;
}

const pct = (value: number) => `${(Math.max(0, Math.min(value, 1)) * 100).toFixed(1)}%`;

export function CoverageChart({
  coverage,
  title = 'Dimension-Level Target Coverage',
  subtitle = 'Achieved coverage against each dimension target',
}: CoverageChartProps) {
  if (!coverage || coverage.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-500">
        No dimension coverage recorded for this session yet.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="space-y-4">
        {coverage.map((item) => (
          <div key={item.dimension_id} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">{item.dimension}</span>
              <span className="font-mono tabular-nums text-slate-900 font-bold">{pct(item.achieved_coverage)}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: pct(item.achieved_coverage) }}
              />
            </div>
            <div className="flex flex-wrap justify-between gap-2 text-[11px] text-slate-500">
              <span>Target: {pct(item.target_coverage)}</span>
              <span>Target attainment: {pct(item.target_attainment)}</span>
              <span>Importance: {Number(item.importance).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
