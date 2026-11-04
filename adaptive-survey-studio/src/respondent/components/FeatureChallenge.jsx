import { useEffect, useRef, useState } from 'react';
import {
  BriefcaseBusiness,
  Check,
  Heart,
  Hand,
  ShieldCheck,
  Wallet,
  Zap,
} from 'lucide-react';
import './FeatureChallenge.css';

const FEATURES = [
  { id: 'fast_heating', label: 'Fast Heating', detail: 'A warm cup, without the wait.', icon: Zap },
  { id: 'affordable_price', label: 'Affordable Price', detail: 'Comfort that fits your budget.', icon: Wallet },
  { id: 'great_taste', label: 'Great Taste', detail: 'Rich, delicious chocolate flavor.', icon: Heart },
  { id: 'portability', label: 'Portability', detail: 'Take your cozy moment anywhere.', icon: BriefcaseBusiness },
  { id: 'safety', label: 'Safety', detail: 'Feel confident with every sip.', icon: ShieldCheck },
  { id: 'easy_to_use', label: 'Easy to Use', detail: 'Simple warmth at the touch of a button.', icon: Hand },
];

export default function FeatureChallenge({
  durationSeconds,
  selectedFeature,
  isSaving,
  isSaved,
  error,
  onSelect,
  onExpire,
}) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const expiresAt = Date.now() + durationSeconds * 1000;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, expiresAt - Date.now());
      setSecondsLeft(Math.ceil(remaining / 1000));
      if (remaining === 0) {
        window.clearInterval(timer);
        onExpireRef.current();
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [durationSeconds]);

  return (
    <section className="feature-challenge" aria-labelledby="feature-challenge-title">
      <div className="feature-challenge-panel">
        <header className="feature-challenge-header">
          <span className="feature-challenge-eyebrow">A QUICK TASTE OF MARKET RESEARCH</span>
          <h1 id="feature-challenge-title">What matters most in your cup?</h1>
          <p>Choose just one must-have feature for a self-heating hot chocolate.</p>
        </header>

        <div className={`feature-challenge-stage ${selectedFeature ? 'has-selection' : ''}`}>
          <div className="feature-challenge-cards">
            {FEATURES.map(({ id, label, detail, icon: Icon }) => (
              <button
                className={`feature-card ${selectedFeature === id ? 'is-selected' : ''} ${selectedFeature && selectedFeature !== id ? 'is-faded' : ''}`}
                key={id}
                type="button"
                aria-pressed={selectedFeature === id}
                disabled={isSaving || (selectedFeature && selectedFeature !== id)}
                onClick={() => onSelect(id)}
              >
                <span className="feature-card-icon"><Icon size={19} strokeWidth={2.2} aria-hidden="true" /></span>
                <span className="feature-card-copy">
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </span>
                {selectedFeature === id && isSaved && <Check className="feature-card-check" size={17} aria-hidden="true" />}
              </button>
            ))}
          </div>

          <div className="feature-challenge-center" aria-hidden="true">
            <div className={`mystery-door ${selectedFeature ? 'is-opening' : ''}`}>
              <span className="mystery-door-knob" />
              <span className="mystery-door-sign">MYSTERY</span>
            </div>
            <div className="chocolate-cup">
              <span className="cup-steam steam-one" />
              <span className="cup-steam steam-two" />
              <span className="cup-top"><span /></span>
              <span className="cup-handle" />
              <span className="cup-body"><span className="cup-heart">♥</span></span>
              <span className="cup-saucer" />
            </div>
            <span className="center-caption">YOUR COZY CUP</span>
          </div>
        </div>

        <div className="feature-challenge-footer">
          <div className="feature-challenge-feedback" role={error ? 'alert' : 'status'} aria-live="polite">
            {error
              ? error
              : selectedFeature && isSaved
                ? `Lovely choice! ${FEATURES.find((feature) => feature.id === selectedFeature)?.label} is your must-have.`
                : isSaving
                  ? 'Saving your choice…'
                  : 'Pick one feature to open the mystery door.'}
          </div>
          <div className="feature-challenge-timer" aria-label={`${secondsLeft} seconds remaining`}>
            <span className="timer-track"><span style={{ transform: `scaleX(${secondsLeft / durationSeconds})` }} /></span>
            <strong>{secondsLeft}s</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
