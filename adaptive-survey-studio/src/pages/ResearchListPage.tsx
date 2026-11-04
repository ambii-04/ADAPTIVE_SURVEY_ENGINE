import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { researchApi } from '../services/researchApi';
import { ResearchProject } from '../types/research';
import { Plus, Search, ExternalLink, Send, BarChart3, Layers } from 'lucide-react';
import { Skeleton } from '../components/common/Skeleton';
import { useToast } from '../lib/toast';

export function ResearchListPage() {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        setProjects(await researchApi.listProjects());
      } catch (err: any) {
        toast.error('Failed to load studies', err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const term = searchTerm.toLowerCase();
  const filtered = projects.filter(
    (p) =>
      p.topic.toLowerCase().includes(term) ||
      p.target_audience.toLowerCase().includes(term) ||
      p.geography.toLowerCase().includes(term)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Research Studies Registry"
        description="Research studies created from this browser, with their dimensional frameworks and survey pipelines."
        kicker="Dentsu Organisation"
        actions={
          <Link
            to="/research/new"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Study</span>
          </Link>
        }
      />

      <div className="relative max-w-md">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter studies by topic, audience, or geography..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          {projects.length === 0
            ? 'No research studies yet. Create your first study to get started!'
            : 'No studies match this filter.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-semibold text-slate-400">STUDY #{project.id}</span>
                  {project.survey ? (
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Survey compiled
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      Not compiled
                    </span>
                  )}
                </div>

                <Link
                  to={`/research/${project.id}`}
                  className="text-sm font-bold text-slate-900 hover:text-teal-700 block transition-colors leading-snug mb-1"
                >
                  {project.topic}
                </Link>

                <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                  <strong className="text-slate-800">Target:</strong> {project.target_audience} · {project.geography}
                </p>

                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                  {project.dimensions.map((dim) => (
                    <span
                      key={dim}
                      className="text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded"
                    >
                      {dim}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link to={`/research/${project.id}`} className="text-xs font-semibold text-slate-700 hover:text-slate-900">
                  Study Details →
                </Link>

                <div className="flex items-center gap-1.5">
                  <Link
                    to={`/research/${project.id}/survey`}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1"
                    title="Survey Configuration & Distribution"
                  >
                    <Send className="w-3 h-3" />
                    <span>Survey</span>
                  </Link>

                  <Link
                    to={`/research/${project.id}/analytics`}
                    className="px-2.5 py-1 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors flex items-center gap-1"
                    title="Research Analytics & Insights"
                  >
                    <BarChart3 className="w-3 h-3" />
                    <span>Analytics</span>
                  </Link>

                  <a
                    href={`/s/${project.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                    title="Open Public Respondent Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
