import { useState } from 'react';
import { Copy, Check, ExternalLink, Share2, Info } from 'lucide-react';
import { useToast } from '../../lib/toast';

interface SurveyShareCardProps {
  researchId: number | string;
  topic?: string;
}

export function SurveyShareCard({ researchId, topic }: SurveyShareCardProps) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const publicPath = `/s/${researchId}`;
  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${publicPath}`
    : `http://localhost:3000${publicPath}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success('Public Survey Link Copied', publicUrl);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Failed to copy', 'Please manually highlight and copy the link.');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
      <div className="pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-900">Public Survey Distribution</h3>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Reusable public entry link for Study #{researchId}
        </p>
      </div>

      {topic && (
        <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <span className="font-semibold text-slate-900">Study: </span>
          <span>{topic}</span>
        </div>
      )}

      {/* URL Input with Copy & Open */}
      <div className="space-y-2">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
          Reusable Respondent URL
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={publicUrl}
            className="flex-1 px-3.5 py-2.5 text-xs font-mono border rounded-lg focus:outline-none bg-slate-50 border-slate-300 text-slate-800"
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </button>
          <a
            href={publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
            title="Open survey in new tab"
          >
            <span>Preview</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>
        </div>
      </div>

      {/* Lifecycle Notice */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-teal-50/60 border border-teal-200/70 text-xs text-slate-700">
        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-[11px]">
          <p className="font-semibold text-teal-900">Session Lifecycle & Respondent Isolation</p>
          <p className="text-slate-600 leading-relaxed">
            Every respondent who opens this link gets their own adaptive session, with its own survey and question
            trajectory, created by the backend. Answers are stored per session.
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <span>Distribute via Email campaigns, WhatsApp groups, or Panel aggregators.</span>
        <span className="font-mono text-[10px] text-slate-400">Target ID: {researchId}</span>
      </div>
    </div>
  );
}
