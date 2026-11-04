import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { SurveyShareCard } from '../components/research/SurveyShareCard';
import { researchApi } from '../services/researchApi';
import { ResearchProject } from '../types/research';
import { useToast } from '../lib/toast';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { Skeleton } from '../components/common/Skeleton';

export function SurveySetupPage() {
  const { researchId } = useParams<{ researchId: string }>();
  const [project, setProject] = useState<ResearchProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [maxQuestions, setMaxQuestions] = useState<number>(10);
  const toast = useToast();

  useEffect(() => {
    async function load() {
      if (!researchId) return;
      setIsLoading(true);
      try {
        const data = await researchApi.getProject(researchId);
        setProject(data);
        if (data?.max_questions) setMaxQuestions(data.max_questions);
      } catch (err: any) {
        toast.error('Failed to load study', err.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [researchId]);

  const handleRecompile = async () => {
    if (!project) return;
    setIsGenerating(true);
    try {
      const survey = await researchApi.generateSurvey({
        research_id: project.id,
        max_questions: maxQuestions,
      });
      setProject((prev) => (prev ? { ...prev, survey, max_questions: maxQuestions } : prev));
      toast.success('Adaptive Survey Recompiled', `"${survey.survey_title}" with ${survey.total_questions} questions`);
    } catch (err: any) {
      toast.error('Survey compilation failed', err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-44 w-full rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
        <p className="text-sm text-slate-600 mb-4">Study not found.</p>
        <Link to="/research" className="text-xs font-semibold text-teal-700">
          Back to studies
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Adaptive Survey Configuration & Distribution"
        description={`Configure parameters and share the public link for Study #${project.id}`}
        kicker="Survey Engine"
        actions={
          <Link
            to={`/research/${project.id}`}
            className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Overview</span>
          </Link>
        }
      />

      <SurveyShareCard researchId={project.id} topic={project.topic} />

      {project.survey ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-2 text-xs text-slate-700">
          <h3 className="text-sm font-bold text-slate-900">Last Compiled Survey</h3>
          <p>
            <span className="font-semibold">{project.survey.survey_title}</span> · {project.survey.total_questions} questions
            · question budget {project.survey.question_budget}
          </p>
          <p className="text-slate-500">Compiled with POST /api/v1/llm/sessions. Each respondent gets a fresh session built from the study’s research plan.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-6 text-xs text-slate-600">
          No survey has been compiled from this browser yet. Compile one below to test the flow.
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Adaptive Parameter Tuning</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Set the question budget and recompile with <code className="font-mono text-slate-700 font-semibold">POST /api/v1/llm/sessions</code>.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Maximum Questions Limit
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={maxQuestions}
              onChange={(e) => setMaxQuestions(Math.min(50, Math.max(1, parseInt(e.target.value) || 10)))}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Current setting: {project.max_questions ?? 10} questions max
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Dimensions Covered
            </label>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 truncate">
              {project.dimensions.join(' · ')}
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleRecompile}
            disabled={isGenerating}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Compiling Model...' : 'Recompile Adaptive Survey'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
