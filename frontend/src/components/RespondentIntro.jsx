import { useState } from 'react';
import { ArrowRight, Coffee, Sparkles } from 'lucide-react';
import './RespondentIntro.css';

const GENDER_OPTIONS = ['Male', 'Female', 'Prefer not to say'];

export default function RespondentIntro({ initialProfile, onStart }) {
  const [name, setName] = useState(initialProfile?.name ?? '');
  const [age, setAge] = useState(initialProfile?.age ?? '');
  const [gender, setGender] = useState(initialProfile?.gender ?? '');
  const [error, setError] = useState('');

  const submit = (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const numericAge = Number(age);
    if (!trimmedName) {
      setError('Please enter your name to continue.');
      return;
    }
    if (!Number.isInteger(numericAge) || numericAge < 1 || numericAge > 120) {
      setError('Please enter a valid age between 1 and 120.');
      return;
    }
    if (!GENDER_OPTIONS.includes(gender)) {
      setError('Please choose a gender option to continue.');
      return;
    }
    setError('');
    onStart({ name: trimmedName, age: numericAge, gender });
  };

  return (
    <main className="respondent-intro-screen">
      <form className="respondent-intro-card" onSubmit={submit}>
        <span className="respondent-intro-cup" aria-hidden="true"><Coffee size={28} /></span>
        <span className="respondent-intro-kicker"><Sparkles size={14} aria-hidden="true" /> BEFORE THE COCOA QUEST</span>
        <h1>First, a little<br /><em>about you</em></h1>
        <p className="respondent-intro-description">This helps us understand who’s dreaming up their perfect hot chocolate.</p>

        <label className="respondent-intro-field">
          <span>Your name</span>
          <input
            type="text"
            name="name"
            autoComplete="given-name"
            maxLength={80}
            placeholder="What should we call you?"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>

        <label className="respondent-intro-field">
          <span>Your age</span>
          <input
            type="number"
            name="age"
            inputMode="numeric"
            min="1"
            max="120"
            step="1"
            placeholder="Enter your age"
            value={age}
            onChange={(event) => setAge(event.target.value)}
            required
          />
        </label>

        <fieldset className="respondent-gender-field">
          <legend>Gender</legend>
          <div className="respondent-gender-options">
            {GENDER_OPTIONS.map((option) => (
              <button
                key={option}
                className={`respondent-gender-option ${gender === option ? 'is-selected' : ''}`}
                type="button"
                aria-pressed={gender === option}
                onClick={() => setGender(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>

        {error && <p className="respondent-intro-error" role="alert">{error}</p>}
        <button className="respondent-intro-submit" type="submit">
          Start your quest <ArrowRight size={18} aria-hidden="true" />
        </button>
        <small className="respondent-intro-note">Your details are used for survey research only.</small>
      </form>
    </main>
  );
}
