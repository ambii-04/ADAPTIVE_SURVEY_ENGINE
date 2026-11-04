import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { MetricCard } from '../components/analytics/MetricCard';
import { CoverageChart } from '../components/analytics/CoverageChart';
import { InsightsPanel } from '../components/analytics/InsightsPanel';
import { analyticsApi } from '../services/analyticsApi';
import { researchApi } from '../services/researchApi';
import { ResearchAnalytics, InsightReport } from '../types/analytics';
import { ResearchProject } from '../types/research';
import { triggerBlobDownload } from '../lib/utils';
import { useToast } from '../lib/toast';
import {
  Download,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowLeft,
  Target,
} from 'lucide-react';
import { Skeleton } from '../components/common/Skeleton';

export function ResearchAnalyticsPage() {
  const { researchId } = useParams<{ researchId: string }>();
  const [project, setProject] = useState<ResearchProject | null>(null);
  const [analytics, setAnalytics] = useState<ResearchAnalytics | null>(null);
  // const [insights, setInsights] = useState<AiInsight | null>(null);
  const [insights, setInsights] = useState<InsightReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const toast = useToast();

  const completionRate =
  analytics && analytics.eligible_sessions > 0
    ? Math.round(
        (analytics.completed_sessions / analytics.eligible_sessions) * 100
      )
    : 0;

  useEffect(() => {
    async function load() {
      if (!researchId) return;
      setIsLoading(true);
      try {
        const [projData, analyticsData] = await Promise.all([
          researchApi.getProject(researchId),
          analyticsApi.getResearchAnalytics(researchId),
        ]);
        setProject(projData);
        setAnalytics(analyticsData);
      } catch (err: any) {
        toast.error('Failed to load analytics', err.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [researchId]);

  const handleExportCsv = async () => {
    if (!researchId) return;
    setIsExporting(true);
    try {
      const blob = await analyticsApi.exportResearchCsv(researchId);
      triggerBlobDownload(blob, `research_${researchId}_analytics_export.csv`);
      toast.success('CSV Download Started', `Downloaded research_${researchId}_analytics_export.csv`);
    } catch (err: any) {
      toast.error('Export failed', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateInsights = async () => {
    if (!researchId) return;
    setIsGeneratingInsights(true);
    try {
      const data = await analyticsApi.generateResearchInsights(researchId);
      setInsights(data);
      toast.success('Research Insights Generated', `POST /api/v1/research/${researchId}/insights`);
    } catch (err: any) {
      toast.error('Insight generation failed', err.message);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
        No analytics data available for Study #{researchId}.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Research-Level Analytics & Synthesis"
        description={`Aggregated findings across all respondent sessions for Study #${researchId}: ${project?.topic ?? ''}`}
        kicker="Empirical Analytics"
        actions={
          <div className="flex items-center gap-2">
            <Link
              to={`/research/${researchId}`}
              className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Study Details</span>
            </Link>

            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 text-slate-500 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Exporting...' : 'Export Dataset CSV'}</span>
            </button>

            <button
              onClick={handleGenerateInsights}
              disabled={isGeneratingInsights}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Synthesize Insights</span>
            </button>
          </div>
        }
      />

      {/* Aggregate Metric Cards */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Respondent Sessions"
          value={analytics.total_sessions}
          subtext="Initiated survey entries"
          icon={<Users className="w-4 h-4 text-slate-600" />}
        />
        <MetricCard
          label="Completed Sessions"
          value={analytics.completed_sessions}
          subtext={`${analytics.completion_rate}% completion rate`}
          badge="High Rigor"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        />
        <MetricCard
          label="Average Completion Time"
          value={`${Math.floor((analytics.average_completion_time_seconds || 164) / 60)}m ${(analytics.average_completion_time_seconds || 164) % 60}s`}
          subtext="Adaptive convergence speed"
          icon={<Clock className="w-4 h-4 text-indigo-600" />}
        />
        <MetricCard
          label="Dimensions Saturated"
          value={analytics.dimension_coverage.length}
          subtext="Optimal construct entropy"
          icon={<Target className="w-4 h-4 text-teal-600" />}
        />
        <MetricCard
          label="Dimensions Saturated"
          value={analytics?.dimensions?.length ?? 0}
          subtext="Optimal construct entropy"
          icon={<Target className="w-4 h-4 text-teal-600" />}
        />
      </div> */}

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Sessions"
          value={analytics.total_sessions}
          subtext="All initiated survey sessions"
          icon={<Users className="w-4 h-4 text-slate-600" />}
        />

        <MetricCard
          label="Eligible Sessions"
          value={analytics.eligible_sessions}
          subtext="Sessions excluding ineligible respondents"
          icon={<Users className="w-4 h-4 text-indigo-600" />}
        />

        <MetricCard
          label="Completed Sessions"
          value={analytics.completed_sessions}
          subtext={`${completionRate}% of eligible sessions`}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        />

        <MetricCard
          label="Research Dimensions"
          value={analytics.dimensions.length}
          subtext="Dimensions tracked by the research plan"
          icon={<Target className="w-4 h-4 text-teal-600" />}
        />
      </div>

      {/* Dimensional Coverage Bar Chart */}
      {/* <CoverageChart
        coverage={analytics.dimensions}
        title="Cross-Cohort Dimensional Construct Saturation"
        subtitle="Tracking target questions answered across all completed sessions"
      /> */}

      {/* Research Dimension Coverage */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Research Dimension Coverage
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Average achieved coverage compared with each dimension's target.
          </p>
        </div>

        {analytics.dimensions.length === 0 ? (
          <p className="text-sm text-slate-500">
            No research dimensions are available.
          </p>
        ) : (
          <div className="space-y-5">
            {analytics.dimensions.map((dimension) => {
              const achieved = Math.max(
                0,
                Math.min(dimension.average_achieved_coverage, 1)
              );

              const target = Math.max(
                0,
                Math.min(dimension.target_coverage, 1)
              );

              const attainment = Math.max(
                0,
                Math.min(dimension.average_target_attainment, 1)
              );

              return (
                <div key={dimension.dimension_id} className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {dimension.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        Importance: {Number(dimension.importance).toFixed(2)}
                        {' · '}
                        Target: {(target * 100).toFixed(1)}%
                      </p>
                    </div>

                    <div className="text-sm sm:text-right">
                      <span className="font-semibold text-slate-900">
                        {(achieved * 100).toFixed(1)}%
                      </span>

                      <span className="text-xs text-slate-500">
                        {' '}achieved
                      </span>
                    </div>
                  </div>

                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all"
                      style={{ width: `${achieved * 100}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                    <span>
                      Target attainment: {(attainment * 100).toFixed(1)}%
                    </span>

                    <span>
                      Coverage gap: {(dimension.target_gap * 100).toFixed(1)}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Coverage records: {dimension.sessions_with_coverage}
                    {' · '}
                    Eligible sessions without coverage:{" "}
                    {dimension.eligible_sessions_without_coverage}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Question Response Distributions */}
      {/* {analytics.distribution && (
        <ResponseDistribution distribution={analytics.distribution} />
      )} */}

      {/* Question Response Distributions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Question Response Distributions
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            Answer counts for each question across eligible respondent sessions.
          </p>
        </div>

        {analytics.question_results.length === 0 ? (
          <p className="text-sm text-slate-500">
            No question results are available yet.
          </p>
        ) : (
          <div className="space-y-6">
            {analytics.question_results.map((question) => {
              const maxCount = Math.max(
                1,
                ...question.answer_distribution.map((item) => item.count)
              );

              return (
                <div
                  key={`${question.question_id}-${question.question}`}
                  className="border-b border-slate-100 pb-5 last:border-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs font-semibold text-indigo-600">
                        {question.question_id}
                      </p>

                      <h4 className="text-sm font-medium text-slate-900 mt-1">
                        {question.question}
                      </h4>
                    </div>

                    <span className="shrink-0 text-xs text-slate-500">
                      {question.responses} responses
                    </span>
                  </div>

                  {question.answer_distribution.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      No responses recorded for this question.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {question.answer_distribution.map((item, index) => (
                        <div
                          key={`${item.answer}-${index}`}
                          className="space-y-1"
                        >
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-slate-700 break-words">
                              {item.answer}
                            </span>

                            <span className="text-slate-500 shrink-0">
                              {item.count}
                            </span>
                          </div>

                          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-indigo-500"
                              style={{
                                width: `${(item.count / maxCount) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Analytics Limitations */}
      {analytics.limitations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-amber-900">
            How to interpret these results
          </h3>

          <ul className="mt-3 space-y-2 list-disc pl-5">
            {analytics.limitations.map((limitation, index) => (
              <li
                key={index}
                className="text-xs leading-relaxed text-amber-900"
              >
                {limitation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Objective Validations if present */}
      {/* {analytics.objective_findings && analytics.objective_findings.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Research Hypothesis & Objective Findings</h3>
            <p className="text-xs text-slate-500 mt-0.5">Empirical validation status derived from respondent answer distributions</p>
          </div>
          <div className="space-y-2.5">
            {analytics.objective_findings.map((item, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-900 block">{item.objective}</span>
                  {item.notes && <p className="text-xs text-slate-600 mt-0.5">{item.notes}</p>}
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded shrink-0">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* AI Insights & Synthesis Panel */}
      <InsightsPanel
        insights={insights}
        isLoading={isGeneratingInsights}
        onGenerate={handleGenerateInsights}
        title="Executive Research Insights & Synthesis"
        scopeLabel="Research Insights"
      />
    </div>
  );
}
