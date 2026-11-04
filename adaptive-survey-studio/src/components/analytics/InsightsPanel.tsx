import { InsightReport } from '../../types/analytics';
import { Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';

interface InsightsPanelProps {
  insights: InsightReport | null;
  isLoading: boolean;
  onGenerate: () => void;
  title?: string;
  scopeLabel?: string;
}

export function InsightsPanel({
  insights,
  isLoading,
  onGenerate,
  title = 'AI Research Insights & Synthesis',
  scopeLabel = 'Research Synthesis',
}: InsightsPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            AI-generated findings grounded in the collected research analytics.
          </p>
        </div>

        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors self-start sm:self-auto disabled:opacity-50 shadow-xs"
        >
          <Sparkles className={`w-3.5 h-3.5 text-teal-400 ${isLoading ? 'animate-spin' : ''}`} />
          <span>
            {isLoading ? 'Synthesizing Data...' : insights ? 'Regenerate Insights' : `Generate ${scopeLabel}`}
          </span>
        </button>
      </div>

      {!insights && !isLoading && (
        <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl space-y-2">
          <Sparkles className="w-6 h-6 text-slate-300 mx-auto" />
          <p className="text-xs text-slate-600">
            No insight synthesis generated yet. Click &quot;Generate {scopeLabel}&quot;
            to analyze the collected research data.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="space-y-4 py-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-3 bg-slate-100 rounded w-full" />
            <div className="h-3 bg-slate-100 rounded w-5/6" />
            <div className="h-3 bg-slate-100 rounded w-2/3" />
          </div>
        </div>
      )}

      {insights && !isLoading && (
        <div className="space-y-6 pt-2">
          <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <CheckCircle className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Respondent Sessions Analysed</p>
              <p className="text-lg font-bold text-slate-900 font-mono">{insights.respondent_count}</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 mb-3">
              <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
              Key Research Findings
            </h4>

            {insights.insights.length > 0 ? (
              <div className="space-y-3">
                {insights.insights.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-mono">
                        {idx + 1}
                      </span>
                      <p className="text-sm font-semibold text-slate-900 leading-relaxed">{item.insight}</p>
                    </div>

                    <div className="ml-7">
                      <p className="text-[10px] font-semibold text-teal-700 uppercase tracking-wider mb-1">
                        Supporting Evidence
                      </p>
                      <p className="text-xs text-slate-700 leading-relaxed">{item.evidence}</p>
                    </div>

                    <div className="ml-7 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                      <p className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider mb-1">
                        Interpretation Caveat
                      </p>
                      <p className="text-xs text-slate-700 leading-relaxed">{item.caveat}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-600">No specific findings were generated from the available data.</p>
              </div>
            )}
          </div>

          {insights.limitations.length > 0 && (
            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Research Limitations
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {insights.limitations.map((limitation, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold shrink-0">!</span>
                    <span className="leading-relaxed">{limitation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
