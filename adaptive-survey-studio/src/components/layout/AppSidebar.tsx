import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  CircleDollarSign,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApiConfig } from '../../context/ApiConfigContext';

interface AppSidebarProps {
  onOpenSettings: () => void;
}

export function AppSidebar({ onOpenSettings }: AppSidebarProps) {
  const { user } = useAuth();
  const { baseUrl, status } = useApiConfig();

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/research', label: 'Research Projects', icon: FolderKanban },
    { to: '/research/new', label: 'New Research', icon: PlusCircle },
    { to: '/pricing-agent', label: 'Pricing Agent', icon: CircleDollarSign },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 selection:bg-teal-500 selection:text-white">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        {/* <div className="w-9 h-9 rounded-lg bg-white overflow-hidden p-0.5 shrink-0 flex items-center justify-center shadow-xs"> */}
          <img
            src="/src/assets/images/logo.png"
            alt="Dentsu Logo"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        {/* </div> */}
        {/* <div className="min-w-0 flex-1">
          <h1 className="text-sm font-bold text-white tracking-tight truncate leading-tight">
            Dentsu Research Studio
          </h1>
          <p className="text-[11px] text-teal-400 font-medium truncate">
            Dentsu Organisation
          </p>
        </div> */}
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4 px-3 space-y-1">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Platform
        </p>
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/research'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <div className="pt-5">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Active Study
          </p>
          <NavLink
            to="/research/1"
            className={({ isActive }) =>
              `flex items-start gap-2 px-3 py-2 text-xs rounded-lg transition-colors ${
                isActive
                  ? 'bg-slate-800 text-teal-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <div className="w-2 h-2 rounded-full bg-teal-400 mt-1 shrink-0" />
            <div className="min-w-0">
              <p className="font-medium truncate text-slate-200 text-xs">Hot Chocolate Study</p>
              <p className="text-[10px] text-slate-500">ID #1 · Adaptive</p>
            </div>
          </NavLink>
        </div>
      </div>

      {/* Backend & Environment Status Card */}
      <div className="p-3 mx-3 mb-3 bg-slate-950/70 rounded-lg border border-slate-800 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Engine Status</span>
          <button
            onClick={onOpenSettings}
            className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1"
          >
            <Settings className="w-3 h-3" /> Config
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              status === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span className="text-[11px] font-medium text-slate-200 truncate">
            {status === 'connected' ? 'FastAPI Connected' : 'Backend Offline'}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1 font-mono truncate">
          {baseUrl}
        </p>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-teal-300 shrink-0">
          {user?.name?.charAt(0) || 'P'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-white truncate">{user?.name || 'Researcher'}</p>
          <p className="text-[10px] text-slate-400 truncate">{user?.role || 'Staff'}</p>
        </div>
      </div>
    </aside>
  );
}
