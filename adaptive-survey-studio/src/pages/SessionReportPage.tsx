import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { MetricCard } from '../components/analytics/MetricCard';
import { CoverageChart } from '../components/analytics/CoverageChart';
import { InsightsPanel } from '../components/analytics/InsightsPanel';
import { analyticsApi } from '../services/analyticsApi';
import { InsightReport, SessionReport } from '../types/analytics';
import { triggerBlobDownload } from '../lib/utils';
import { useToast } from '../lib/toast';
import { Download, Sparkles, Users, HelpCircle, Layers, ArrowLeft } from 'lucide-react';
import { Skeleton } from '../components/common/Skeleton';

export function SessionReportPage() {
  const { researchId, sessionId } = useParams<{ researchId: string; sessionId: string }>();
  const [report, setReport] = useState<SessionReport | null>(null);
  const [insights, setInsights] = useState<InsightReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const toast = useToast();

  useEffect(() => {
    async function loadReport() {
      if (!sessionId) return;
      setIsLoading(true);
      try {
        setReport(await analyticsApi.getSessionReport(sessionId));
      } catch (err: any) {
        toast.error('Failed to load session report', err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadReport();
  }, [sessionId]);

  const handleExportCsv = async () => {
    if (!sessionId) return;
    setIsExporting(true);
    try {
      const blob = await analyticsApi.exportSessionCsv(sessionId);
      triggerBlobDownload(blob, `session_${sessionId}_export.csv`);
      toast.success('CSV Download Started', `Downloaded session_${sessionId}_export.csv`);
    } catch (err: any) {
      toast.error('Export failed', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleGenerateInsights = async () => {
    if (!sessionId) return;
    setIsGeneratingInsights(true);
    try {
      setInsights(await analyticsApi.generateSessionInsights(sessionId));
      toast.success('Session Insights Generated', `POST /api/v1/sessions/${sessionId}/insights`);
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
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
        Session report for {sessionId} could not be found.
      </div>
    );
  }

  const answeredQuestions = report.question_results.filter((q) => q.responses > 0).length;
  const coveredDimensions = report.dimension_coverage.filter((d) => d.achieved_coverage > 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Respondent Session Report: ${sessionId}`}
        description={`Question-level responses and dimension coverage for this session in Study #${researchId}`}
        kicker="Individual Session Telemetry"
        actions={
          <div className="flex items-center gap-2">
            <Link
              to={`/research/${researchId}`}
              className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Study Overview</span>
            </Link>

            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 text-slate-500 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Exporting...' : 'Export Session CSV'}</span>
            </button>

            <button
              onClick={handleGenerateInsights}
              disabled={isGeneratingInsights}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Session Insights</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Respondents"
          value={report.respondent_count}
          subtext="Respondents in this session"
          icon={<Users className="w-4 h-4 text-slate-600" />}
        />
        <MetricCard
          label="Answers Recorded"
          value={report.answer_count}
          subtext="Responses saved for this session"
          icon={<HelpCircle className="w-4 h-4 text-teal-600" />}
        />
        <MetricCard
          label="Questions Answered"
          value={answeredQuestions}
          subtext="Distinct questions with a response"
          icon={<HelpCircle className="w-4 h-4 text-indigo-600" />}
        />
        <MetricCard
          label="Dimensions Covered"
          value={coveredDimensions}
          subtext={`of ${report.dimension_coverage.length} tracked dimensions`}
          icon={<Layers className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      <CoverageChart
        coverage={report.dimension_coverage}
        title="Session Dimension Coverage"
        subtitle="Dimensions this respondent's answers covered, against each dimension target"
      />

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Question Responses</h3>
          <p className="text-xs text-slate-500 mt-1">Answers recorded for this session, by question.</p>
        </div>

        {report.question_results.length === 0 ? (
          <p className="text-sm text-slate-500">No questions are part of this session.</p>
        ) : (
          <div className="space-y-5">
            {report.question_results.map((question) => (
              <div key={question.question_id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <p className="text-xs font-semibold text-indigo-600">{question.question_id}</p>
                <h4 className="text-sm font-medium text-slate-900 mt-1">{question.question}</h4>
                {question.answer_distribution.length === 0 ? (
                  <p className="text-xs text-slate-400 mt-2">Not answered in this session.</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {question.answer_distribution.map((item, idx) => (
                      <li key={idx} className="flex items-center justify-between text-xs text-slate-700">
                        <span>{item.answer}</span>
                        <span className="text-slate-500">{item.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <InsightsPanel
        insights={insights}
        isLoading={isGeneratingInsights}
        onGenerate={handleGenerateInsights}
        title="Session-Level AI Insights & Synthesis"
        scopeLabel="Session Insights"
      />
    </div>
  );
}
