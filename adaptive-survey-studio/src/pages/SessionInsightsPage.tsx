import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { InsightsPanel } from '../components/analytics/InsightsPanel';
import { analyticsApi } from '../services/analyticsApi';
import { InsightReport } from '../types/analytics';
import { useToast } from '../lib/toast';
import { ArrowLeft, FileText } from 'lucide-react';
import { Skeleton } from '../components/common/Skeleton';

export function SessionInsightsPage() {
  const { researchId, sessionId } = useParams<{ researchId: string; sessionId: string }>();
  const [insights, setInsights] = useState<InsightReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const toast = useToast();

  useEffect(() => {
    async function load() {
      if (!sessionId) return;
      setIsLoading(true);
      try {
        const data = await analyticsApi.generateSessionInsights(sessionId);
        setInsights(data);
      } catch (err: any) {
        toast.error('Failed to load session insights', err.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [sessionId]);

  const handleRegenerate = async () => {
    if (!sessionId) return;
    setIsGenerating(true);
    try {
      const data = await analyticsApi.generateSessionInsights(sessionId);
      setInsights(data);
      toast.success('Session Insights Refreshed');
    } catch (err: any) {
      toast.error('Insight generation failed', err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Session Insights: ${sessionId}`}
        description={`AI-generated analytical observations from respondent session in Study #${researchId}`}
        kicker="Session Intelligence"
        actions={
          <div className="flex items-center gap-2">
            <Link
              to={`/research/${researchId}/sessions/${sessionId}`}
              className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Session Report</span>
            </Link>
            <Link
              to={`/research/${researchId}`}
              className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Study Overview</span>
            </Link>
          </div>
        }
      />

      <InsightsPanel
        insights={insights}
        isLoading={isGenerating}
        onGenerate={handleRegenerate}
        title="Individual Session Behavioral Insights"
        scopeLabel="Session Insights"
      />
    </div>
  );
}
