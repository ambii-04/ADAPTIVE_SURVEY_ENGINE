import React, { useState } from 'react';
import { ResearchProject, ResearchPlan } from '../../types/research';
import { ArrowLeft, Send } from 'lucide-react';

interface SurveyConfigurationProps {
  project: Partial<ResearchProject>;
  plan: ResearchPlan;
  onGenerate: (maxQuestions: number) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function SurveyConfiguration({
  project,
  plan,
  onGenerate,
  onBack,
  isLoading,
}: SurveyConfigurationProps) {
  const [maxQuestions, setMaxQuestions] = useState<number>(project.max_questions || 10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(maxQuestions);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-8 rounded-xl border border-slate-200">
      <div>
        <h2 className="text-base font-bold text-slate-900">Step 3: Survey Generation & Distribution Configuration</h2>
        <p className="text-xs text-slate-500 mt-1">
          Compile the adaptive survey model by calling <code className="font-mono text-slate-700 font-semibold">POST /api/v1/llm/sessions</code> with the verified research plan.
        </p>
      </div>

      {/* Summary of Brief and Plan */}
      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <span className="font-semibold text-slate-500 block text-[10px] uppercase">Research Topic</span>
            <span className="text-slate-900 font-medium">{project.topic}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block text-[10px] uppercase">Target Audience</span>
            <span className="text-slate-900">{project.target_audience}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block text-[10px] uppercase">Geography</span>
            <span className="text-slate-900">{project.geography}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block text-[10px] uppercase">Dimensions ({project.dimensions?.length || 0})</span>
            <span className="text-slate-900">{project.dimensions?.join(', ')}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2 text-slate-600">
          <span className="w-2 h-2 rounded-full bg-teal-500"></span>
          <span>
            Research Plan attached: {plan.research_objectives.length} objectives, {plan.hypotheses.length} hypotheses, {plan.constructs.length} constructs.
          </span>
        </div>
      </div>

      {/* Configuration Inputs */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Maximum Questions per Respondent Session
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={3}
              max={30}
              value={maxQuestions}
              onChange={(e) => setMaxQuestions(Math.max(3, parseInt(e.target.value) || 10))}
              className="w-32 px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-slate-900"
            />
            <span className="text-xs text-slate-500">
              Adaptive engine dynamically optimizes stopping criteria up to this limit (default: 10). The age screening question does not count toward it.
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-teal-200/80 bg-teal-50/40 text-xs text-teal-900 leading-relaxed">
          <p className="font-semibold mb-1">Adaptive Question Selection Guarantee:</p>
          <p className="text-slate-600">
            The FastAPI backend determines question branching and completion based on dimensional entropy reduction. Respondents receive unique, sequentially optimized question sequences.
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Plan</span>
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <span>{isLoading ? 'Generating Adaptive Model...' : 'Generate Adaptive Survey & Public Link'}</span>
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
