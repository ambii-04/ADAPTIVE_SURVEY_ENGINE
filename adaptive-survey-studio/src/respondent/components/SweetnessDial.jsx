import { useState } from 'react';
import { Coffee, Sparkles } from 'lucide-react';
import './SweetnessDial.css';

const SWEETNESS_LEVELS = [
  { value: 1, label: 'Low', detail: 'Just a hint of sweet' },
  { value: 2, label: 'Light', detail: 'A little sweetness' },
  { value: 3, label: 'Balanced', detail: 'The cozy classic' },
  { value: 4, label: 'Sweet', detail: 'A sweeter sip' },
  { value: 5, label: 'Extra sweet', detail: 'Dessert-in-a-cup energy' },
];

export default function SweetnessDial({ initialLevel = 3, isSaving = false, error = '', onSave }) {
  const [level, setLevel] = useState(initialLevel);
  const selected = SWEETNESS_LEVELS[level - 1];

  return (
    <section className="sweetness-dial-screen" aria-labelledby="sweetness-dial-title">
      <div className="sweetness-dial-card">
        <span className="sweetness-dial-eyebrow"><Sparkles size={15} aria-hidden="true" /> QUICK COCOA CUSTOMIZATION</span>
        <h1 id="sweetness-dial-title">How sweet should your hot chocolate be?</h1>
        <p className="sweetness-dial-intro">Turn the dial to your perfect sip. No wrong answers, just your vibe.</p>

        <div className="sweetness-cup-preview" aria-hidden="true">
          <span className="sweetness-steam sweetness-steam-one" />
          <span className="sweetness-steam sweetness-steam-two" />
          <span className="sweetness-steam sweetness-steam-three" />
          <span className="sweetness-cup"><Coffee size={58} strokeWidth={1.5} /></span>
          <span className="sweetness-saucer" />
          <span className="sweetness-sugar-stars"><Sparkles size={21} /></span>
        </div>

        <div className="sweetness-current" aria-live="polite">
          <span>Your sweetness level</span>
          <strong>{selected.label}</strong>
          <small>{selected.detail}</small>
        </div>

        <div className="sweetness-range-wrap">
          <div className="sweetness-range-labels" aria-hidden="true">
            <span>LOW</span>
            <span>HIGH</span>
          </div>
          <input
            className="sweetness-range"
            type="range"
            min="1"
            max={SWEETNESS_LEVELS.length}
            step="1"
            value={level}
            style={{ '--sweetness-progress': `${((level - 1) / (SWEETNESS_LEVELS.length - 1)) * 100}%` }}
            aria-label="Sweetness level"
            aria-valuetext={`${selected.label}: ${selected.detail}`}
            onChange={(event) => setLevel(Number(event.target.value))}
            disabled={isSaving}
          />
          <div className="sweetness-ticks" aria-hidden="true">
            {SWEETNESS_LEVELS.map((item) => <span key={item.value} className={level === item.value ? 'is-active' : ''} />)}
          </div>
        </div>

        <button className="sweetness-save" type="button" onClick={() => onSave(level)} disabled={isSaving}>
          {isSaving ? 'Saving your sweet spot…' : 'Lock in my sweet spot'}
          {!isSaving && <Coffee size={18} aria-hidden="true" />}
        </button>
        {error && <p className="sweetness-error" role="alert">{error}</p>}
        <p className="sweetness-footer">A little extra sweet? Main character cocoa energy.</p>
      </div>
    </section>
  );
}
