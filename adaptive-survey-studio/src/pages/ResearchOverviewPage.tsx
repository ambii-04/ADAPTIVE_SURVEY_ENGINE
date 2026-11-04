import { useState, useEffect, FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { SurveyShareCard } from '../components/research/SurveyShareCard';
import { researchApi } from '../services/researchApi';
import { ResearchProject } from '../types/research';
import { BarChart3, Send, Layers, Globe, Users, Target, FileText, ArrowRight } from 'lucide-react';
import { Skeleton } from '../components/common/Skeleton';

export function ResearchOverviewPage() {
  const { researchId } = useParams<{ researchId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ResearchProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionLookup, setSessionLookup] = useState('');

  useEffect(() => {
    async function fetchProject() {
      if (!researchId) return;
      setIsLoading(true);
      try {
        const data = await researchApi.getProject(researchId);
        setProject(data);
      } catch (err) {
        console.error('Failed to load project', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProject();
  }, [researchId]);

  const handleSessionLookup = (e: FormEvent) => {
    e.preventDefault();
    const id = sessionLookup.trim();
    if (id && project) navigate(`/research/${project.id}/sessions/${encodeURIComponent(id)}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
        <p className="text-sm text-slate-600 mb-4">Research project not found.</p>
        <Link to="/research" className="text-xs font-semibold text-teal-700 hover:underline">
          Return to Research Studies
        </Link>
      </div>
    );
  }

  const plan = project.research_plan;

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.topic}
        description={`Study #${project.id} · Target Cohort: ${project.target_audience}`}
        kicker="Research Project Overview"
        actions={
          <div className="flex items-center gap-2">
            <Link
              to={`/research/${project.id}/survey`}
              className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-slate-500" />
              <span>Survey Configuration</span>
            </Link>
            <Link
              to={`/research/${project.id}/analytics`}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <BarChart3 className="w-3.5 h-3.5 text-teal-400" />
              <span>Analytics & Insights</span>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-start gap-3">
          <div className="p-2 bg-slate-50 rounded-lg text-teal-600 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Target Audience</span>
            <p className="text-xs font-medium text-slate-800 mt-0.5 leading-snug">{project.target_audience}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-start gap-3">
          <div className="p-2 bg-slate-50 rounded-lg text-indigo-600 shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Geographic Scope</span>
            <p className="text-xs font-medium text-slate-800 mt-0.5 leading-snug">{project.geography}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-start gap-3">
          <div className="p-2 bg-slate-50 rounded-lg text-emerald-600 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Research Constructs</span>
            <p className="text-xs font-medium text-slate-800 mt-0.5 leading-snug">
              {project.dimensions.length} Analytical Dimensions
            </p>
          </div>
        </div>
      </div>

      <SurveyShareCard researchId={project.id} topic={project.topic} />

      {plan ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">Synthesized Research Plan</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">POST /api/v1/llm/research-plan</span>
          </div>

          {plan.research_objectives.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
                <Target className="w-3.5 h-3.5 text-teal-600" /> Research Objectives
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {plan.research_objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold">•</span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plan.constructs.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Dimensional Constructs</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plan.constructs.map((c, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
                    <span className="font-bold text-slate-900 block mb-1">{c.dimension}</span>
                    <p className="text-slate-600 text-[11px]">{c.measurement_method}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-6 text-xs text-slate-600">
          The research plan is stored on the server but this browser has not received it. Create the study
          from this browser to see the plan here.
        </div>
      )}

      {/* Session report lookup: the backend has no session list endpoint. */}
      <form
        onSubmit={handleSessionLookup}
        className="bg-slate-900 text-white p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h4 className="text-sm font-bold">Individual Respondent Session Reports</h4>
          <p className="text-xs text-slate-300 mt-0.5">
            Enter a session ID (shown on the respondent’s completion screen) to open its question-by-question report.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="text"
            inputMode="numeric"
            value={sessionLookup}
            onChange={(e) => setSessionLookup(e.target.value)}
            placeholder="Session ID"
            className="w-32 px-3 py-2 text-xs font-mono rounded-lg text-slate-900 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!sessionLookup.trim()}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <span>Open Report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
