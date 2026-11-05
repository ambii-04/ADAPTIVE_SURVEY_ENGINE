import { useState } from 'react';
import { BadgeIndianRupee, LoaderCircle, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PageHeader } from '../components/layout/PageHeader';
import { apiFetch, ApiError, LLM_TIMEOUT_MS } from '../services/apiClient';

interface PricingReport {
  text: string;
}

export function PricingAgentPage() {
  const [city, setCity] = useState('');
  const [month, setMonth] = useState('');
  const [report, setReport] = useState<PricingReport | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setReport(null);

    try {
      const result = await apiFetch<PricingReport>('/api/v1/llm/pricing', {
        method: 'POST',
        body: JSON.stringify({ city: city.trim(), month: month.trim() }),
        timeoutMs: LLM_TIMEOUT_MS,
      });
      setReport(result);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : requestError instanceof Error
            ? requestError.message
            : 'Could not generate the pricing report.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing Agent"
        description="Generate a city- and month-specific pricing recommendation."
        kicker="Pricing Intelligence"
      />

      <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 md:p-6 border-b border-slate-100 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
            <BadgeIndianRupee className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Pricing scenario</h2>
            <p className="text-xs text-slate-500 mt-1">
              Choose a target city and month to receive a tailored pricing report.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pricing-city" className="block text-xs font-semibold text-slate-700 mb-1.5">
                City
              </label>
              <input
                id="pricing-city"
                name="city"
                type="text"
                autoComplete="address-level2"
                required
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="e.g. Bengaluru, Pune, Delhi"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
            <div>
              <label htmlFor="pricing-month" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Month
              </label>
              <input
                id="pricing-month"
                name="month"
                type="text"
                required
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                placeholder="e.g. February, March, November"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-1">
            <p className="text-[11px] text-slate-500">
              The report may take a few minutes to generate.
            </p>
            <button
              type="submit"
              disabled={isLoading || !city.trim() || !month.trim()}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {isLoading ? 'Generating report…' : 'Generate pricing report'}
            </button>
          </div>
        </form>
      </section>

      {error && (
        <div role="alert" className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-800">
          <p className="font-semibold text-xs">Pricing report could not be generated</p>
          <p className="text-xs mt-1 break-words">{error}</p>
        </div>
      )}

      {report && (
        <section aria-live="polite" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Pricing report · {city.trim()}, {month.trim()}
            </h2>
          </div>
          <div className="p-5 md:p-6 text-sm text-slate-700 leading-7 break-words [&>*+*]:mt-4 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-900 [&_p]:my-2 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_strong]:font-semibold [&_strong]:text-slate-900 [&_blockquote]:border-l-4 [&_blockquote]:border-teal-500 [&_blockquote]:pl-4 [&_blockquote]:text-slate-600 [&_hr]:my-5 [&_hr]:border-slate-200 [&_table]:w-full [&_table]:min-w-[640px] [&_table]:border-collapse [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:text-slate-700 [&_th]:border [&_th]:border-slate-200 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_td]:border [&_td]:border-slate-200 [&_tr:nth-child(even)]:bg-slate-50">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ children }) => (
                  <div className="my-4 overflow-x-auto rounded-lg border border-slate-200">
                    <table>{children}</table>
                  </div>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    className="text-teal-700 underline underline-offset-2 hover:text-teal-900"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {report.text}
            </ReactMarkdown>
          </div>
        </section>
      )}
    </div>
  );
}
