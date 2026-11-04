import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { CHAMBERS, DEFAULT_CHOICES, labelFor } from './ingredients.js';
import './quest.css';

const STATE_KEY = 'chocowarm-quest-state';
const SAVED_KEY = 'chocowarm-saved-cup';
const TOPPINGS = CHAMBERS.find((chamber) => chamber.id === 'toppings');

function loadChoices() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STATE_KEY) || 'null');
    if (Array.isArray(saved?.choices?.toppings)) {
      return { ...DEFAULT_CHOICES, toppings: saved.choices.toppings };
    }
  } catch {
    // Start with no selections if saved data is unavailable or invalid.
  }
  return { ...DEFAULT_CHOICES, toppings: [] };
}

function ToppingPicker({ initial, onConfirm }) {
  const [picked, setPicked] = useState(initial);
  const toggle = (id) => {
    setPicked((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= TOPPINGS.max) return current;
      return [...current, id];
    });
  };

  return <section className="quest-chamber-stage" aria-label="Choose your toppings">
    <div className="chamber-card">
      <span className="quest-kicker">Your hot chocolate</span>
      <h1>{TOPPINGS.title}</h1>
      <p>{TOPPINGS.prompt}</p>
      <div className="chamber-options" role="group" aria-label={TOPPINGS.title}>
        {TOPPINGS.options.map((option) => {
          const selected = picked.includes(option.id);
          return <button
            key={option.id}
            type="button"
            className={`chamber-option ${selected ? 'is-selected' : ''}`}
            aria-pressed={selected}
            onClick={() => toggle(option.id)}
          >
            {option.label}
          </button>;
        })}
      </div>
      <button
        type="button"
        className="quest-start small"
        disabled={picked.length === 0}
        onClick={() => onConfirm(picked)}
      >
        Confirm my toppings <ArrowRight size={18} aria-hidden="true" />
      </button>
    </div>
  </section>;
}

function ToppingResult({ toppings, onEdit, onSave, onContinue, savedNote }) {
  const labels = toppings.map((id) => labelFor('toppings', id));
  return <section className="quest-result" aria-label="Your topping preferences">
    <span className="quest-kicker">Your preference</span>
    <h1 className="quest-name">Your favourite toppings</h1>
    <p className="quest-desc">You chose {labels.join(', ')} for your hot chocolate.</p>
    <ul className="quest-recipe">
      {labels.map((label) => <li key={label}>{label}</li>)}
    </ul>
    <div className="quest-result-actions">
      <button type="button" className="quest-start small" onClick={onEdit}>EDIT TOPPINGS</button>
      <button type="button" className="quest-start small" onClick={onSave}>SAVE MY PREFERENCE</button>
    </div>
    {savedNote && <p className="quest-message" role="status">{savedNote}</p>}
    <button type="button" className="quest-link" onClick={onContinue}>
      Continue to the survey <ArrowRight size={16} aria-hidden="true" />
    </button>
  </section>;
}

export default function ToppingPreference({ onDone }) {
  const [toppings, setToppings] = useState(loadChoices);
  const [confirmed, setConfirmed] = useState(false);
  const [savedNote, setSavedNote] = useState('');

  useEffect(() => {
    try {
      window.localStorage.setItem(STATE_KEY, JSON.stringify({ choices: { toppings } }));
    } catch {
      // The choice remains available for this visit if storage is blocked.
    }
  }, [toppings]);

  if (!confirmed) {
    return <div className="quest-root">
      <ToppingPicker
        initial={toppings.toppings}
        onConfirm={(selected) => {
          setToppings({ ...DEFAULT_CHOICES, toppings: selected });
          setSavedNote('');
          setConfirmed(true);
        }}
      />
    </div>;
  }

  return <div className="quest-root">
    <ToppingResult
      toppings={toppings.toppings}
      savedNote={savedNote}
      onEdit={() => setConfirmed(false)}
      onSave={() => {
        try {
          window.localStorage.setItem(SAVED_KEY, JSON.stringify({
            toppings: toppings.toppings,
            savedAt: new Date().toISOString(),
          }));
          setSavedNote('Saved on this device.');
        } catch {
          setSavedNote('Could not save on this device, but your preference is still shown.');
        }
      }}
      onContinue={onDone}
    />
  </div>;
}
