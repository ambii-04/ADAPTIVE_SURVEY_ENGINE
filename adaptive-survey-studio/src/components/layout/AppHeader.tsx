import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApiConfig } from '../../context/ApiConfigContext';
import { Settings, LogOut, ExternalLink, ChevronRight, Server } from 'lucide-react';

interface AppHeaderProps {
  onOpenSettings: () => void;
}

export function AppHeader({ onOpenSettings }: AppHeaderProps) {
  const { user, signOut } = useAuth();
  const { status } = useApiConfig();
  const location = useLocation();

  // Generate simple breadcrumbs from pathname
  const pathSegments = location.pathname.split('/').filter(Boolean);

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link to="/dashboard" className="hover:text-slate-900 transition-colors">
          Dentsu Studio
        </Link>
        {pathSegments.map((segment, index) => {
          const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
          const isLast = index === pathSegments.length - 1;
          const label =
            segment === 'research'
              ? 'Research'
              : segment === 'new'
              ? 'New Project'
              : segment === 'survey'
              ? 'Survey Setup'
              : segment === 'analytics'
              ? 'Analytics'
              : segment === 'sessions'
              ? 'Sessions'
              : segment === 'insights'
              ? 'Insights'
              : !isNaN(Number(segment))
              ? `Project #${segment}`
              : segment;

          return (
            <div key={path} className="flex items-center gap-2">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              {isLast ? (
                <span className="text-slate-900 font-semibold">{label}</span>
              ) : (
                <Link to={path} className="hover:text-slate-900 transition-colors">
                  {label}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Environment Indicator */}
        <button
          onClick={onOpenSettings}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
            status === 'connected'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
          }`}
          title="Click to view backend connection configuration"
        >
          <Server className="w-3.5 h-3.5" />
          <span>
            {status === 'connected' ? 'FastAPI Live' : 'Backend Offline'}
          </span>
        </button>

        {/* Public Survey Shortcut Preview */}
        <Link
          to="/s/1"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-slate-100 transition-colors"
          title="Open Public Respondent Survey View"
        >
          <span>Public Survey</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </Link>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-200" />

        {/* Sign Out */}
        <button
          onClick={signOut}
          className="text-xs font-medium text-slate-500 hover:text-rose-600 flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors"
          title="Sign out of demo account"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
