import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { ResearchForm } from '../components/research/ResearchForm';
import { ResearchPlanViewer } from '../components/research/ResearchPlanViewer';
import { SurveyConfiguration } from '../components/research/SurveyConfiguration';
import { SurveyShareCard } from '../components/research/SurveyShareCard';
import { researchApi } from '../services/researchApi';
import { CompiledSurvey, CreateResearchPayload, ResearchPlan, ResearchProject } from '../types/research';
import { useToast } from '../lib/toast';
import { Check } from 'lucide-react';

const INITIAL_BRIEF: CreateResearchPayload = {
  topic: 'Instant self-heating hot chocolate market assessment',
  target_audience: 'College students and young professionals aged 18–26',
  geography: 'Tier 1 and Tier 2 cities in India',
  dimensions: [
    'Product Interest',
    'Purchase Intent',
    'Price Sensitivity',
    'Safety Perception',
    'Consumption Occasions',
    'Convienience and Portability'
  ],
};

function isSameBrief(a: CreateResearchPayload, b: CreateResearchPayload): boolean {
  return (
    a.topic === b.topic &&
    a.target_audience === b.target_audience &&
    a.geography === b.geography &&
    JSON.stringify(a.dimensions) === JSON.stringify(b.dimensions)
  );
}

export function CreateResearchPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [brief, setBrief] = useState<CreateResearchPayload>(INITIAL_BRIEF);
  const [project, setProject] = useState<ResearchProject | null>(null);
  const [researchPlan, setResearchPlan] = useState<ResearchPlan | null>(null);
  const [compiledSurvey, setCompiledSurvey] = useState<CompiledSurvey | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Brief submitted -> POST /api/v1/research, then POST /api/v1/llm/research-plan with the research ID only.
  const handleBriefSubmit = async (values: CreateResearchPayload) => {
    setIsLoading(true);
    try {
      // Re-use the study if the brief is unchanged after a failed plan request, so a retry does not create a duplicate.
      const study = project && isSameBrief(brief, values) ? project : await researchApi.createProject(values);
      setBrief(values);
      setProject(study);

      const plan = await researchApi.generateResearchPlan({ research_id: study.id });
      setResearchPlan(plan);
      setStep(2);
      toast.success('Research Plan Generated', `Study #${study.id}: POST /api/v1/llm/research-plan`);
    } catch (err: any) {
      toast.error('Failed to generate research plan', err.message || 'Check API backend connectivity.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Configure survey -> POST /api/v1/llm/sessions with the research ID and question budget.
  const handleGenerateSurvey = async (maxQuestions: number) => {
    if (!project) return;
    setIsLoading(true);
    try {
      const survey = await researchApi.generateSurvey({
        research_id: project.id,
        max_questions: maxQuestions,
      });
      setCompiledSurvey(survey);
      setStep(4);
      toast.success('Adaptive Survey Compiled', `"${survey.survey_title}" with ${survey.total_questions} questions`);
    } catch (err: any) {
      toast.error('Survey generation failed', err.message || 'Check API backend connectivity.');
    } finally {
      setIsLoading(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Research Brief' },
    { num: 2, title: 'Plan Synthesis' },
    { num: 3, title: 'Adaptive Config' },
    { num: 4, title: 'Public Distribution' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Adaptive Research Study"
        description="Define analytical scope, synthesize theoretical framework, and compile the adaptive survey model."
        kicker="New Study Pipeline"
      />

      {/* Stepper Progress Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {stepsList.map((s, idx) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;

            return (
              <div key={s.num} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-teal-600 text-white'
                      : isCurrent
                      ? 'bg-slate-900 text-white ring-4 ring-slate-100'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:inline ${
                    isCurrent ? 'text-slate-900 font-semibold' : 'text-slate-500'
                  }`}
                >
                  {s.title}
                </span>
                {idx < stepsList.length - 1 && (
                  <div className="w-6 sm:w-12 h-px bg-slate-200 mx-1 sm:mx-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {step === 1 && (
        <ResearchForm
          initialValues={brief}
          onSubmit={handleBriefSubmit}
          isLoading={isLoading}
        />
      )}

      {step === 2 && researchPlan && (
        <ResearchPlanViewer
          plan={researchPlan}
          onProceed={() => setStep(3)}
          onBack={() => setStep(1)}
          isLoading={isLoading}
        />
      )}

      {step === 3 && researchPlan && project && (
        <SurveyConfiguration
          project={project}
          plan={researchPlan}
          onGenerate={handleGenerateSurvey}
          onBack={() => setStep(2)}
          isLoading={isLoading}
        />
      )}

      {step === 4 && project && compiledSurvey && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 text-xs text-slate-700 space-y-1">
            <p className="font-semibold text-slate-900">{compiledSurvey.survey_title}</p>
            <p>
              {compiledSurvey.total_questions} questions compiled (question budget {compiledSurvey.question_budget}).
              Each respondent who opens the link gets their own adaptive session.
            </p>
          </div>

          <SurveyShareCard researchId={project.id} topic={project.topic} />

          <div className="flex justify-end gap-3">
            <button
              onClick={() => navigate(`/research/${project.id}`)}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              Go to Study Overview
            </button>
            <button
              onClick={() => navigate(`/research/${project.id}/analytics`)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Open Analytics Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
