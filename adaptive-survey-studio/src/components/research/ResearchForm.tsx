import React, { useState } from 'react';
import { Plus, Trash2, ArrowRight } from 'lucide-react';

interface ResearchFormProps {
  initialValues?: {
    topic: string;
    target_audience: string;
    geography: string;
    dimensions: string[];
  };
  onSubmit: (values: {
    topic: string;
    target_audience: string;
    geography: string;
    dimensions: string[];
  }) => void;
  isLoading?: boolean;
}

const DEFAULT_DIMENSIONS = [
  'Product Interest',
  'Purchase Intent',
  'Price Sensitivity',
  'Safety Perception',
  'Consumption Occasions',
];

export function ResearchForm({ initialValues, onSubmit, isLoading }: ResearchFormProps) {
  const [topic, setTopic] = useState(
    initialValues?.topic || 'Instant self-heating hot chocolate market assessment'
  );
  const [targetAudience, setTargetAudience] = useState(
    initialValues?.target_audience || 'College students and young professionals aged 18–26'
  );
  const [geography, setGeography] = useState(
    initialValues?.geography || 'Tier 1 and Tier 2 cities in India'
  );
  const [dimensions, setDimensions] = useState<string[]>(
    initialValues?.dimensions && initialValues.dimensions.length > 0
      ? initialValues.dimensions
      : DEFAULT_DIMENSIONS
  );
  const [newDimension, setNewDimension] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddDimension = () => {
    const trimmed = newDimension.trim();
    if (!trimmed) return;
    if (dimensions.includes(trimmed)) {
      setErrors((prev) => ({ ...prev, dimension: 'This dimension is already added.' }));
      return;
    }
    setDimensions([...dimensions, trimmed]);
    setNewDimension('');
    setErrors((prev) => ({ ...prev, dimension: '' }));
  };

  const handleRemoveDimension = (index: number) => {
    if (dimensions.length <= 1) {
      setErrors((prev) => ({ ...prev, dimension: 'At least one research dimension is required.' }));
      return;
    }
    setDimensions(dimensions.filter((_, i) => i !== index));
    setErrors((prev) => ({ ...prev, dimension: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!topic.trim()) newErrors.topic = 'Research topic is required.';
    if (!targetAudience.trim()) newErrors.targetAudience = 'Target audience is required.';
    if (!geography.trim()) newErrors.geography = 'Geography is required.';
    if (dimensions.length === 0) newErrors.dimension = 'At least one dimension is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit({
      topic: topic.trim(),
      target_audience: targetAudience.trim(),
      geography: geography.trim(),
      dimensions,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-8 rounded-xl border border-slate-200">
      <div>
        <h2 className="text-base font-bold text-slate-900">Step 1: Research Brief & Scope</h2>
        <p className="text-xs text-slate-500 mt-1">
          Specify the research question, target participant criteria, geographic bounds, and analytical dimensions.
        </p>
      </div>

      <div className="space-y-4">
        {/* Research Topic */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Research Topic <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Instant self-heating hot chocolate market assessment"
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-slate-900"
          />
          {errors.topic && <p className="text-xs text-rose-600 mt-1">{errors.topic}</p>}
        </div>

        {/* Target Audience & Geography Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Target Audience <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. College students and young professionals aged 18–26"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-slate-900"
            />
            {errors.targetAudience && <p className="text-xs text-rose-600 mt-1">{errors.targetAudience}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Geography <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={geography}
              onChange={(e) => setGeography(e.target.value)}
              placeholder="e.g. Tier 1 and Tier 2 cities in India"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-slate-900"
            />
            {errors.geography && <p className="text-xs text-rose-600 mt-1">{errors.geography}</p>}
          </div>
        </div>

        {/* Dynamic Research Dimensions */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Research Dimensions ({dimensions.length}) <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-500">
              Adaptive questions will cover these constructs
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {dimensions.map((dim, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
              >
                <span>{dim}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveDimension(idx)}
                  className="text-slate-400 hover:text-rose-600 transition-colors"
                  aria-label={`Remove dimension ${dim}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newDimension}
              onChange={(e) => setNewDimension(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddDimension();
                }
              }}
              placeholder="Add another dimension (e.g. Packaging Ergonomics, Brand Familiarity)"
              className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
            <button
              type="button"
              onClick={handleAddDimension}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
          {errors.dimension && <p className="text-xs text-rose-600 mt-1">{errors.dimension}</p>}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <span>{isLoading ? 'Creating Brief...' : 'Proceed to Plan Generation'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
