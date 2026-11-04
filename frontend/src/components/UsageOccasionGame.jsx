import { useState } from 'react';
import {
  BedDouble,
  BriefcaseBusiness,
  Building2,
  CarFront,
  Check,
  Coffee,
  House,
  LampDesk,
  Luggage,
  Monitor,
  Mountain,
  Sparkles,
  Sun,
  TentTree,
  TrainFront,
  Trees,
} from 'lucide-react';
import './UsageOccasionGame.css';

const LOCATIONS = [
  {
    id: 'hostel',
    label: 'Hostel',
    icon: House,
    situation: 'It is a chilly evening in your hostel room, but the shared kitchen is busy.',
    question: 'Would you use self-heating hot chocolate for a cozy cup in your room?',
  },
  {
    id: 'road_trip',
    label: 'Road Trip',
    icon: CarFront,
    situation: 'You are taking a break during a long road trip, far from your usual café stop.',
    question: 'Would you enjoy a hot chocolate break along the way?',
  },
  {
    id: 'camping',
    label: 'Camping',
    icon: TentTree,
    situation: 'The sun has gone down at your campsite, and the night air is getting cold.',
    question: 'Would a self-heating hot chocolate make your camping evening better?',
  },
  {
    id: 'office',
    label: 'Office',
    icon: BriefcaseBusiness,
    situation: 'You need a warm afternoon pick-me-up, but the office pantry is occupied.',
    question: 'Would you keep self-heating hot chocolate at work for moments like this?',
  },
  {
    id: 'travel',
    label: 'Travel',
    icon: Luggage,
    situation: 'You are waiting at a station or airport between legs of a long journey.',
    question: 'Would you choose a warm cup that is ready without a café queue?',
  },
  {
    id: 'picnic',
    label: 'Picnic',
    icon: Trees,
    situation: 'You are relaxing outdoors on a breezy picnic, and fancy something warm.',
    question: 'Would self-heating hot chocolate be a welcome picnic treat?',
  },
];

const OPTIONS = [
  { id: 'definitely', label: 'Definitely' },
  { id: 'maybe', label: 'Maybe' },
  { id: 'no', label: 'No' },
];

const SCENE_PROPS = {
  hostel: [House, BedDouble],
  road_trip: [Mountain, CarFront],
  camping: [Trees, TentTree],
  office: [Building2, Monitor, LampDesk],
  travel: [TrainFront, Luggage],
  picnic: [Sun, Trees],
};

function OccasionScene({ location }) {
  const props = SCENE_PROPS[location.id] ?? [];
  return (
    <span className={`occasion-scene occasion-scene-${location.id}`} aria-hidden="true">
      <span className="occasion-scene-glow" />
      {props.map((SceneIcon, index) => (
        <span className={`occasion-scene-prop occasion-scene-prop-${index + 1}`} key={index}>
          <SceneIcon size={index === 0 ? 33 : 27} strokeWidth={1.65} />
        </span>
      ))}
      {location.id === 'office' && <span className="occasion-office-desk" />}
      <span className="occasion-scene-cup"><Coffee size={37} strokeWidth={1.8} /></span>
      <span className="occasion-scene-steam occasion-scene-steam-one" />
      <span className="occasion-scene-steam occasion-scene-steam-two" />
      <span className="occasion-scene-sparkle"><Sparkles size={15} /></span>
    </span>
  );
}

export default function UsageOccasionGame({
  responses,
  completedLocations,
  onAnswer,
  onComplete,
  onContinue,
}) {
  const [activeLocation, setActiveLocation] = useState(null);
  const [savingLocation, setSavingLocation] = useState(null);
  const [error, setError] = useState('');
  const active = LOCATIONS.find((location) => location.id === activeLocation);
  const completedCount = completedLocations.length;
  const isComplete = completedCount === LOCATIONS.length;

  const answerLocation = async (location, response) => {
    setSavingLocation(location.id);
    setError('');
    try {
      await onAnswer(location.id, response);
    } catch (saveError) {
      setError(`We couldn't save your ${location.label} response (${saveError.message}). Please try again.`);
    } finally {
      setSavingLocation(null);
    }
  };

  const markComplete = () => {
    if (!active || !responses[active.id]) return;
    onComplete(active.id);
    setActiveLocation(null);
    setError('');
  };

  return (
    <section className="usage-occasion-game" aria-labelledby="usage-occasion-title">
      <div className="usage-occasion-panel">
        <header className="usage-occasion-header">
          <span className="usage-occasion-eyebrow"><Sparkles size={14} aria-hidden="true" /> A LITTLE HOT-CHOCOLATE DAYDREAM</span>
          <h1 id="usage-occasion-title">Would you use it there?</h1>
          <p>Flip each card and tell us where you would reach for a self-heating cup.</p>
        </header>

        <div
          className="occasion-progress"
          role="progressbar"
          aria-label="Usage locations completed"
          aria-valuemin={0}
          aria-valuemax={LOCATIONS.length}
          aria-valuenow={completedCount}
        >
          <div className="occasion-progress-track"><span style={{ width: `${(completedCount / LOCATIONS.length) * 100}%` }} /></div>
          <strong>{completedCount} of {LOCATIONS.length} explored</strong>
        </div>

        {isComplete ? (
          <div className="occasion-reward" role="status">
            <span className="occasion-reward-cup" aria-hidden="true">☕</span>
            <span className="usage-occasion-eyebrow">ALL COZY CORNERS EXPLORED</span>
            <h2>Your next adventure is on us!</h2>
            <p>Thanks for helping us discover where a warm cup belongs.</p>
            <button type="button" className="occasion-continue" onClick={onContinue}>
              Claim your reward <Sparkles size={17} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <>
            <div className="occasion-card-grid">
              {LOCATIONS.map((location) => {
                const Icon = location.icon;
                const flipped = activeLocation === location.id;
                const completed = completedLocations.includes(location.id);
                return (
                  <article className={`occasion-flip-card ${flipped ? 'is-flipped' : ''}`} key={location.id}>
                    <div className="occasion-flip-inner">
                      <button
                        type="button"
                        className="occasion-card-face occasion-card-front"
                        onClick={() => { setActiveLocation(flipped ? null : location.id); setError(''); }}
                        aria-label={`${flipped ? 'Return to' : 'Flip'} ${location.label} card${completed ? ', completed' : ''}`}
                        aria-expanded={flipped}
                        disabled={savingLocation !== null}
                      >
                        <OccasionScene location={location} />
                        <strong>{location.label}</strong>
                        <small>{completed ? 'Explored' : 'Tap to explore'}</small>
                        {completed && <span className="occasion-complete-badge"><Check size={13} aria-hidden="true" /> Done</span>}
                      </button>

                      <div className="occasion-card-face occasion-card-back" aria-hidden={!flipped} inert={!flipped}>
                        <span className="occasion-back-label"><Icon size={15} aria-hidden="true" /> {location.label}</span>
                        <p className="occasion-situation">{location.situation}</p>
                        <h2>{location.question}</h2>
                        <div className="occasion-answer-options" aria-label={`Would you use it in ${location.label}?`}>
                          {OPTIONS.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              className={`occasion-answer ${responses[location.id] === option.id ? 'is-chosen' : ''}`}
                              aria-pressed={responses[location.id] === option.id}
                              disabled={savingLocation === location.id}
                              onClick={() => answerLocation(location, option.id)}
                            >
                              {savingLocation === location.id ? 'Saving…' : option.label}
                            </button>
                          ))}
                        </div>
                        {responses[location.id] && (
                          <div className="occasion-card-actions">
                            <button
                              type="button"
                              className="occasion-secondary-action"
                              disabled={savingLocation !== null}
                              onClick={() => { setActiveLocation(null); setError(''); }}
                            >
                              Back to cards
                            </button>
                            <button
                              type="button"
                              className="occasion-complete-action"
                              disabled={savingLocation !== null}
                              onClick={markComplete}
                            >
                              Mark completed <Check size={15} aria-hidden="true" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="occasion-footer" aria-live={error ? 'assertive' : 'polite'} role={error ? 'alert' : 'status'}>
              {error || (active ? 'Choose an answer, then return to the cards or mark this place complete.' : 'Choose any card to see its own little real-life moment.')}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
