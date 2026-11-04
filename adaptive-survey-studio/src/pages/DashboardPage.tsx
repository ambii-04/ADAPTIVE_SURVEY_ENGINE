import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { MetricCard } from '../components/analytics/MetricCard';
import { researchApi } from '../services/researchApi';
import { analyticsApi } from '../services/analyticsApi';
import { ResearchAnalytics } from '../types/analytics';
import { ResearchProject } from '../types/research';
import {
  FolderKanban,
  Users,
  CheckCircle2,
  HelpCircle,
  Plus,
  Search,
  ExternalLink,
  BarChart2,
  Send,
  Eye,
} from 'lucide-react';
import { TableRowSkeleton } from '../components/common/Skeleton';
import { useToast } from '../lib/toast';

interface StudyRow {
  project: ResearchProject;
  analytics: ResearchAnalytics | null;
}

export function DashboardPage() {
  const [rows, setRows] = useState<StudyRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const projects = await researchApi.listProjects();
        // Analytics are per study. A study whose analytics fail still appears, with no numbers.
        const results = await Promise.allSettled(
          projects.map((p) => analyticsApi.getResearchAnalytics(p.id))
        );
        setRows(
          projects.map((project, i) => {
            const result = results[i];
            return {
              project,
              analytics: result.status === 'fulfilled' ? result.value : null,
            };
          })
        );
      } catch (err: any) {
        toast.error('Failed to load studies', err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const totals = rows.reduce(
    (acc, row) => {
      if (row.analytics) {
        acc.sessions += row.analytics.total_sessions;
        acc.completed += row.analytics.completed_sessions;
        acc.answers += row.analytics.question_results.reduce((sum, q) => sum + q.responses, 0);
      }
      return acc;
    },
    { sessions: 0, completed: 0, answers: 0 }
  );

  const completionRate = totals.sessions > 0 ? Math.round((totals.completed / totals.sessions) * 100) : 0;

  const term = searchTerm.toLowerCase();
  const filteredRows = rows.filter(
    ({ project }) =>
      project.topic.toLowerCase().includes(term) || String(project.id).includes(term)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Research Dashboard"
        description="Monitor research studies, respondent sessions, and dimensional coverage."
        kicker="Dentsu Organisation"
        actions={
          <Link
            to="/research/new"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Research Study</span>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Research Studies"
          value={isLoading ? '—' : rows.length}
          subtext="Studies created from this browser"
          icon={<FolderKanban className="w-4 h-4 text-teal-600" />}
        />
        <MetricCard
          label="Respondent Sessions"
          value={isLoading ? '—' : totals.sessions}
          subtext="Across all studies"
          icon={<Users className="w-4 h-4 text-indigo-600" />}
        />
        <MetricCard
          label="Completed Sessions"
          value={isLoading ? '—' : totals.completed}
          subtext={`${completionRate}% completion rate`}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        />
        <MetricCard
          label="Answers Recorded"
          value={isLoading ? '—' : totals.answers}
          subtext="Question responses captured"
          icon={<HelpCircle className="w-4 h-4 text-amber-600" />}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by topic or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 w-16">ID</th>
                <th className="py-3 px-4 min-w-[240px]">Topic & Target Cohort</th>
                <th className="py-3 px-4">Geography</th>
                <th className="py-3 px-4">Dimensions</th>
                <th className="py-3 px-4">Sessions</th>
                <th className="py-3 px-4">Survey</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <>
                  <TableRowSkeleton columns={7} />
                  <TableRowSkeleton columns={7} />
                  <TableRowSkeleton columns={7} />
                </>
              )}

              {!isLoading && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No research studies found.
                  </td>
                </tr>
              )}

              {!isLoading &&
                filteredRows.map(({ project, analytics }) => (
                  <tr key={project.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-600">#{project.id}</td>
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/research/${project.id}`}
                        className="font-semibold text-slate-900 hover:text-teal-700 block transition-colors leading-tight"
                      >
                        {project.topic}
                      </Link>
                      <span className="text-[11px] text-slate-500 block mt-0.5">{project.target_audience}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{project.geography}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-slate-800 font-medium">{project.dimensions.length}</span>
                      <span className="text-slate-400 text-[10px] ml-1">constructs</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-800">
                      {analytics ? `${analytics.completed_sessions} / ${analytics.total_sessions}` : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {project.survey ? (
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          Compiled
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          Not compiled
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/research/${project.id}`}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          title="View Study Overview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          to={`/research/${project.id}/survey`}
                          className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-md transition-colors"
                          title="Configure & Share Survey"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          to={`/research/${project.id}/analytics`}
                          className="p-1.5 text-slate-600 hover:text-indigo-700 hover:bg-slate-100 rounded-md transition-colors"
                          title="Research Analytics & Reports"
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                        </Link>
                        <a
                          href={`/s/${project.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                          title="Open Public Survey Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
