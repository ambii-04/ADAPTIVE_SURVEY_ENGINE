import React, { useState } from 'react';
import { Modal } from './Modal';
import { useApiConfig } from '../../context/ApiConfigContext';
import { CheckCircle2, AlertTriangle, RefreshCw, Server, HelpCircle } from 'lucide-react';
import { useToast } from '../../lib/toast';

interface BackendSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BackendSettingsModal({ isOpen, onClose }: BackendSettingsModalProps) {
  const { baseUrl, status, lastChecked, setBaseUrl, checkConnection } = useApiConfig();
  const [tempUrl, setTempUrl] = useState(baseUrl);
  const [isTesting, setIsTesting] = useState(false);
  const toast = useToast();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBaseUrl(tempUrl);
    setIsTesting(true);
    const connected = await checkConnection();
    setIsTesting(false);
    if (connected) {
      toast.success('Connected to backend successfully', tempUrl);
    } else {
      toast.info('Backend unreachable', `Unable to verify ${tempUrl}. Start the FastAPI backend and try again.`);
    }
    onClose();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    const connected = await checkConnection();
    setIsTesting(false);
    if (connected) {
      toast.success('Backend connection verified');
    } else {
      toast.error('Connection failed', 'FastAPI backend was not reachable at this URL.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Backend API Configuration"
      description="Configure the connection to the FastAPI backend."
      maxWidth="lg"
    >
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            FastAPI Base URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-mono text-slate-800"
            />
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              Test
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Configured via <code className="font-mono text-slate-700">VITE_API_BASE_URL</code>. All calls route to <code className="font-mono text-slate-700">/api/v1/*</code>.
          </p>
        </div>

        {/* Current status info */}
        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-3 text-xs">
          <Server className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-800">Connection State:</span>
              {status === 'connected' ? (
                <span className="text-emerald-700 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Online (FastAPI)
                </span>
              ) : (
                <span className="text-amber-700 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" /> Offline / Standalone
                </span>
              )}
            </div>
            {lastChecked && (
              <p className="text-slate-500 mt-0.5">
                Last verified: {lastChecked.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Backend Endpoints Checklist */}
        <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-slate-400" /> Contract Endpoints:
          </p>
          <ul className="list-disc pl-4 space-y-0.5 font-mono text-[10px] text-slate-600">
            <li>POST /api/v1/llm/research-plan</li>
            <li>POST /api/v1/research</li>
            <li>POST /api/v1/llm/sessions</li>
            <li>GET /api/v1/sessions/{'{session_id}'}/next</li>
            <li>POST /api/v1/sessions/{'{session_id}'}/responses</li>
            <li>GET /api/v1/sessions/{'{session_id}'}/report & export.csv</li>
            <li>GET /api/v1/research/{'{id}'}/analytics & export.csv</li>
          </ul>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </Modal>
  );
}
