import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import RunnerWorld from './components/RunnerWorld.jsx';
import ChapterTrail from './components/ChapterTrail.jsx';
import FeatureChallenge from './components/FeatureChallenge.jsx';
import UsageOccasionGame from './components/UsageOccasionGame.jsx';
import SweetnessDial from './components/SweetnessDial.jsx';
import RespondentIntro from './components/RespondentIntro.jsx';
import RankingPanel from './components/RankingPanel.jsx';
import PriceWheel from './components/PriceWheel.jsx';
import { DESTINATIONS } from './components/Destinations.jsx';
import { ArrowLeft, ArrowRight, Volume2, VolumeX, Sparkles, Coffee, Compass, Mountain, RotateCcw, Timer, Pause, Play, Check } from 'lucide-react';
import { researchService } from './services/index.js';
import { sfx, setSoundEnabled } from './utils/sound.js';
import './App.css';
import './StartTheme.css';

const optionColors = ['amber', 'blue', 'violet', 'green'];
const optionSymbols = ['heart', 'energy', 'relax', 'taste'];
const NO_OPTIONS = [];
// Every question type the backend can return (see app/schemas/question.py). Anything else is shown as unsupported.
const SUPPORTED_QUESTION_TYPES = ['single_choice', 'likert', 'multiple_choice', 'price_input', 'ranking'];
// Multiple-choice and price answers save on their own after the player pauses; price gets longer so partial numbers aren't saved.
const MULTI_AUTO_SAVE_MS = 1500;
const PRICE_AUTO_SAVE_MS = 2500;
// Local demo persistence only: the backend session is not restored from here.
const JOURNEY_KEY = 'chocowarm-journey-v1';
const RESPONDENT_PROFILE_KEY = 'chocowarm-respondent-profile-v1';
const SOUND_KEY = 'chocowarm-sound';
// Longest a run-through is allowed to take before the journey continues anyway (runs take about 5–15 seconds).
const RUN_WATCHDOG_MS = 30000;
const FEATURE_CHALLENGE_SECONDS = 7;

function readSavedJourney() {
  try {
    return JSON.parse(window.localStorage.getItem(JOURNEY_KEY) || 'null');
  } catch {
    return null;
  }
}

function readRespondentProfile() {
  try {
    return JSON.parse(window.localStorage.getItem(RESPONDENT_PROFILE_KEY) || 'null');
  } catch {
    return null;
  }
}

function initialScreen(saved) {
  if (!saved?.sessionId) return 'introduction';
  if (saved.screen === 'toppings' || saved.screen === 'quest') {
    if (saved.usageOccasionPending) return 'usageOccasion';
    if (saved.sweetnessDialPending && !saved.sweetnessDialSaved) return 'sweetnessDial';
    return saved.question ? 'game' : 'complete';
  }
  if (saved.screen === 'usageOccasion') return 'usageOccasion';
  if (saved.screen === 'featureChallenge') return 'featureChallenge';
  if (saved.screen === 'sweetnessDial') return 'sweetnessDial';
  if (saved.screen === 'game' && saved.question) return 'game';
  if (saved.screen === 'complete') return 'complete';
  return 'welcome';
}

function toGameQuestion(question, index) {
  if (!question) return null;

  return {
    id: question.question_id,
    place: `Question ${index + 1}`,
    question: question.text,
    questionType: question.question_type,
    helper: question.question_type === 'price_input'
      ? 'Tap Spin, then Stop on the price you would pay.'
      : question.question_type === 'multiple_choice'
        ? 'Pick every option that applies. Your answer saves after a short pause.'
        : question.question_type === 'likert'
          ? 'Pick the point on the scale that fits you best.'
          : (question.options || []).length === 2
            ? 'Pick one of the two options.'
            : 'Choose the answer that best fits you.',
    options: (question.options || []).map((option, optionIndex) => ({
      id: option.option_id,
      label: option.label,
      color: optionColors[optionIndex % optionColors.length],
      symbol: optionSymbols[optionIndex % optionSymbols.length],
    })),
  };
}

function App() {
  const [savedJourney] = useState(readSavedJourney);
  const [screen, setScreen] = useState(() => initialScreen(savedJourney));
  const [respondentProfile, setRespondentProfile] = useState(() => savedJourney?.respondentProfile ?? readRespondentProfile());
  const [question, setQuestion] = useState(() => savedJourney?.question ?? null);
  const [selected, setSelected] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [answers, setAnswers] = useState(() => savedJourney?.answers ?? []);
  const [soundOn, setSoundOn] = useState(() => window.localStorage.getItem(SOUND_KEY) !== 'off');
  const [characterId, setCharacterId] = useState(() => savedJourney?.characterId ?? 'boy');
  const [sessionId, setSessionId] = useState(() => savedJourney?.sessionId ?? null);
  const [totalQuestions, setTotalQuestions] = useState(() => savedJourney?.totalQuestions ?? 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [responseSaved, setResponseSaved] = useState(() => savedJourney?.responseSaved ?? false);
  const [featureChallengeSaved, setFeatureChallengeSaved] = useState(() => savedJourney?.featureChallengeSaved ?? false);
  const [featureChallengeChoice, setFeatureChallengeChoice] = useState(() => savedJourney?.featureChallengeChoice ?? null);
  const [featureChallengeSaving, setFeatureChallengeSaving] = useState(false);
  const [featureChallengeError, setFeatureChallengeError] = useState('');
  const [usageOccasionPending, setUsageOccasionPending] = useState(() => savedJourney?.usageOccasionPending ?? false);
  const [usageResponses, setUsageResponses] = useState(() => savedJourney?.usageResponses ?? {});
  const [completedUsageLocations, setCompletedUsageLocations] = useState(() => savedJourney?.completedUsageLocations ?? []);
  const [sweetnessDialPending, setSweetnessDialPending] = useState(() => savedJourney?.sweetnessDialPending ?? false);
  const [sweetnessDialLevel, setSweetnessDialLevel] = useState(() => savedJourney?.sweetnessDialLevel ?? 3);
  const [sweetnessDialSaved, setSweetnessDialSaved] = useState(() => savedJourney?.sweetnessDialSaved ?? false);
  const [sweetnessDialSaving, setSweetnessDialSaving] = useState(false);
  const [sweetnessDialError, setSweetnessDialError] = useState('');
  const [gameRunId, setGameRunId] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(() => savedJourney?.elapsedSeconds ?? 0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [priceAnswer, setPriceAnswer] = useState(() => savedJourney?.priceAnswer ?? '');
  // The price question starts as a spin wheel; the player can switch to typing an amount.
  const [typedPrice, setTypedPrice] = useState(false);
  const [completionStatus, setCompletionStatus] = useState(() => savedJourney?.completionStatus ?? 'completed');
  const [saveState, setSaveState] = useState('idle');
  const [error, setError] = useState('');
  // While a refreshed journey is being checked against the server, doors are locked.
  const [resuming, setResuming] = useState(() => initialScreen(savedJourney) === 'game');
  const runFinishRef = useRef(null);
  const featureChallengeExpiredRef = useRef(false);
  // busyRef blocks new picks until the scene has reset; submittingRef blocks overlapping saves.
  const busyRef = useRef(false);
  const submittingRef = useRef(false);
  const current = useMemo(
    () => toGameQuestion(question, Math.max(answers.length - Number(responseSaved), 0)),
    [question, answers.length, responseSaved],
  );
  const progress = useMemo(
    () => ({ completed: answers.length, total: totalQuestions }),
    [answers.length, totalQuestions],
  );
  const selectedSeason = useMemo(
    () => answers.find((answer) => answer.questionId === 'Q031')?.answer ?? 'Spring',
    [answers],
  );
  const formattedTime = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}`;
  const canResume = Boolean(sessionId && question);

  // Save progress locally so a refresh returns to the same question.
  useEffect(() => {
    if (!sessionId || (screen !== 'game' && screen !== 'featureChallenge' && screen !== 'usageOccasion' && screen !== 'complete')) return;
    window.localStorage.setItem(JOURNEY_KEY, JSON.stringify({
      screen, sessionId, totalQuestions, question, answers, characterId,
      respondentProfile,
      completionStatus, elapsedSeconds, responseSaved, priceAnswer,
      featureChallengeSaved, featureChallengeChoice,
      usageOccasionPending, usageResponses, completedUsageLocations,
      sweetnessDialPending, sweetnessDialLevel, sweetnessDialSaved,
    }));
  }, [screen, sessionId, totalQuestions, question, answers, characterId, respondentProfile, completionStatus, elapsedSeconds, responseSaved, priceAnswer, featureChallengeSaved, featureChallengeChoice, usageOccasionPending, usageResponses, completedUsageLocations, sweetnessDialPending, sweetnessDialLevel, sweetnessDialSaved]);

  // The backend returns the same unanswered question on every /next call, so asking it on refresh
  // confirms the saved question is still current, or moves on if the answer was saved before the reload.
  useEffect(() => {
    if (!resuming) return undefined;
    let cancelled = false;
    researchService.getNextQuestion({ sessionId: savedJourney.sessionId })
      .then((next) => {
        if (cancelled) return;
        setQuestion(next.next_question);
        setCompletionStatus(next.status);
        setResponseSaved(false);
        setScreen(next.next_question ? 'game' : 'complete');
      })
      .catch((resumeError) => {
        if (cancelled) return;
        clearJourney();
        setScreen('welcome');
        setError(`Your saved journey could not be restored (${resumeError.message}). Start a new one.`);
      })
      .finally(() => {
        if (!cancelled) setResuming(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearJourney = () => {
    window.localStorage.removeItem(JOURNEY_KEY);
    busyRef.current = false;
    submittingRef.current = false;
    setQuestion(null);
    setSessionId(null);
    setTotalQuestions(0);
    setAnswers([]);
    setSelected(null);
    setResponseSaved(false);
    setFeatureChallengeSaved(false);
    setFeatureChallengeChoice(null);
    setFeatureChallengeSaving(false);
    setFeatureChallengeError('');
    setUsageOccasionPending(false);
    setUsageResponses({});
    setCompletedUsageLocations([]);
    setSweetnessDialPending(false);
    setSweetnessDialLevel(3);
    setSweetnessDialSaved(false);
    setSweetnessDialSaving(false);
    setSweetnessDialError('');
    featureChallengeExpiredRef.current = false;
    setElapsedSeconds(0);
    setTimerPaused(false);
    setPriceAnswer('');
    setSaveState('idle');
    setError('');
  };

  const startJourney = () => {
    if (canResume) {
      setScreen('game');
      return;
    }
    setScreen('character');
    setError('');
  };

  const restartJourney = () => {
    clearJourney();
    setScreen('character');
  };

  // Stable callbacks, so the memoized 3D scene does not re-render on every timer tick.
  const handleRunComplete = useCallback(() => {
    sfx.pass();
    runFinishRef.current?.();
  }, []);
  const handleSceneReady = useCallback(() => {
    busyRef.current = false;
  }, []);

  // Chapter feedback: when the runner moves on to a new destination, a short banner marks the completed chapter.
  const chapterIndex = Math.min(Math.floor(answers.length / 6), DESTINATIONS.length - 1);
  const [chapterToast, setChapterToast] = useState('');
  const toastTimerRef = useRef(null);
  // One timer for the banner: a newer banner replaces the old one and restarts the countdown, so it always clears.
  const showChapterToast = useCallback((text) => {
    window.clearTimeout(toastTimerRef.current);
    setChapterToast(text);
    toastTimerRef.current = window.setTimeout(() => setChapterToast(''), 3200);
  }, []);
  useEffect(() => () => window.clearTimeout(toastTimerRef.current), []);
  const lastChapterRef = useRef(chapterIndex);
  useEffect(() => {
    if (chapterIndex === lastChapterRef.current) return;
    lastChapterRef.current = chapterIndex;
    showChapterToast(`${DESTINATIONS[chapterIndex - 1].name} complete. Heading to ${DESTINATIONS[chapterIndex].name}.`);
  }, [chapterIndex, showChapterToast]);

  // Encouragement at 25%, 50% and 75% of the survey. The first render is not announced, so a restored journey stays quiet.
  const milestoneFor = (completed, total) => {
    if (!total) return 0;
    const percent = (completed / total) * 100;
    return percent >= 75 ? 75 : percent >= 50 ? 50 : percent >= 25 ? 25 : 0;
  };
  const MILESTONE_MESSAGES = {
    25: 'Yay! 25% done, nice start!',
    50: 'Wow, 50% done, you are going great!',
    75: '75% done, you are almost there!',
  };
  const milestoneRef = useRef(milestoneFor(answers.length, totalQuestions));
  useEffect(() => {
    const milestone = milestoneFor(progress.completed, progress.total);
    if (milestone > milestoneRef.current) {
      milestoneRef.current = milestone;
      showChapterToast(MILESTONE_MESSAGES[milestone]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.completed, progress.total, showChapterToast]);

  // Sound effects follow the toggle, and the choice is remembered between visits.
  useEffect(() => {
    setSoundEnabled(soundOn);
    window.localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off');
  }, [soundOn]);

  // Save confirmations and errors also play a sound.
  useEffect(() => {
    if (saveState === 'saved') sfx.saved();
    if (saveState === 'failed') sfx.error();
  }, [saveState]);

  useEffect(() => {
    if (screen === 'complete') sfx.complete();
  }, [screen]);

  const chooseDoor = useCallback((option) => {
    if (busyRef.current || resuming || transitioning || isSubmitting || responseSaved || current?.questionType === 'ranking') return;
    sfx.pick();
    if (current?.questionType === 'multiple_choice') {
      setSelected((previous) => {
        const selections = Array.isArray(previous) ? previous : [];
        return selections.some((item) => item.id === option.id)
          ? selections.filter((item) => item.id !== option.id)
          : [...selections, option];
      });
      return;
    }
    if (selected) return;
    busyRef.current = true;
    setSelected(option);
  }, [current?.questionType, isSubmitting, resuming, responseSaved, selected, transitioning]);

  const beginAdventure = async () => {
    setIsStarting(true);
    clearJourney();
    try {
      const session = await researchService.startSession();
      if (!respondentProfile) {
        throw new Error('Please complete the introduction before starting the survey.');
      }
      await researchService.submitRespondentProfile({
        sessionId: session.sessionId,
        ...respondentProfile,
      });
      const firstQuestion = await researchService.getNextQuestion({
        sessionId: session.sessionId,
      });
      setSessionId(session.sessionId);
      // The session stops at max_questions, so the planned total can't exceed it.
      setTotalQuestions(Math.min(session.totalQuestions, session.maxQuestions));
      setQuestion(firstQuestion.next_question);
      setCompletionStatus(firstQuestion.status);
      sfx.start();
      setScreen(firstQuestion.next_question ? 'game' : 'complete');
    } catch (startError) {
      setError(startError.message);
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    if (screen !== 'game' || timerPaused) return undefined;
    const timerId = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [screen, timerPaused]);

  // override: the ranking panel passes its ordered options here; doors use the current selection.
  const enterDoor = async (override) => {
    if (submittingRef.current) return;
    if (!current || !sessionId || timerPaused || resuming) {
      busyRef.current = false;
      return;
    }
    const selections = Array.isArray(override) ? override : Array.isArray(selected) ? selected : selected ? [selected] : [];
    // A number passed in by the price wheel wins over the typed amount.
    const priceOverride = typeof override === 'number' ? override : null;
    const numericPrice = priceOverride ?? Number(priceAnswer);
    let answerSaved = responseSaved;
    const shouldShowFeatureChallenge = answers.length + Number(!answerSaved) === 6;
    const answersAfterCurrent = answers.length + Number(!answerSaved);
    const shouldShowSweetnessDial = answersAfterCurrent === 8 && !sweetnessDialSaved;
    const sweetnessDialPendingAfterCurrent = sweetnessDialPending || shouldShowSweetnessDial;
    const shouldShowUsageOccasion = (
      current.id === 'Q003' || answersAfterCurrent === 6
    ) && completedUsageLocations.length < 6;
    if (!answerSaved && current.questionType === 'price_input') {
      if ((priceOverride === null && !priceAnswer) || !Number.isFinite(numericPrice) || numericPrice < 0) {
        busyRef.current = false;
        return;
      }
    } else if (!answerSaved && selections.length === 0) {
      busyRef.current = false;
      return;
    }

    submittingRef.current = true;
    busyRef.current = true;
    // Every answer plays the same run-through: the runner walks up, the answer saves, then the runner passes through.
    const runFinished = new Promise((resolve) => { runFinishRef.current = resolve; });
    setTransitioning(true);
    setIsSubmitting(true);
    setError('');
    setSaveState(answerSaved ? 'saved' : 'saving');
    try {
      if (!answerSaved) {
        const payload = {
          sessionId,
          questionId: current.id,
          ...(current.questionType === 'price_input'
            ? { answerValue: numericPrice }
            : current.questionType === 'multiple_choice' || current.questionType === 'ranking'
              ? { answerValue: selections.map((option) => option.id) }
              : { optionId: selections[0].id }),
        };
        try {
          await researchService.submitResponse(payload);
        } catch (saveError) {
          // The server already holds this answer (for example after a dropped reply): treat it as saved and move on.
          if (saveError.status !== 409 || !/already been answered/i.test(saveError.message)) throw saveError;
        }
        answerSaved = true;
        setResponseSaved(true);
        setAnswers((previous) => [
          ...previous,
          {
            questionId: current.id,
            question: current.question,
            answer: current.questionType === 'price_input'
              ? `₹${numericPrice}`
              : selections.map((option) => option.label).join(', '),
          },
        ]);
        setSaveState('saved');
      }
      const nextPromise = researchService.getNextQuestion({ sessionId });
      // Errors from this request are handled below, once the run has finished.
      nextPromise.catch(() => {});
      // Watchdog: if the scene never reports the run as finished, don't lock the journey. The answer is already saved.
      await Promise.race([runFinished, new Promise((resolve) => window.setTimeout(resolve, RUN_WATCHDOG_MS))]);
      const next = await nextPromise;
      setResponseSaved(false);
      setSelected(null);
      setPriceAnswer('');
      setSaveState('idle');
      setQuestion(next.next_question);
      setCompletionStatus(next.status);
      setGameRunId((previous) => previous + 1);
      setSweetnessDialPending(sweetnessDialPendingAfterCurrent);
      if (shouldShowFeatureChallenge && !featureChallengeSaved) {
        setUsageOccasionPending(shouldShowUsageOccasion);
        setFeatureChallengeChoice(null);
        setFeatureChallengeError('');
        featureChallengeExpiredRef.current = false;
        setScreen('featureChallenge');
      } else if (shouldShowUsageOccasion) {
        setScreen('usageOccasion');
      } else if (sweetnessDialPendingAfterCurrent) {
        setSweetnessDialError('');
        setScreen('sweetnessDial');
      } else {
        setScreen(next.next_question ? 'game' : 'complete');
      }
    } catch (submitError) {
      busyRef.current = false;
      setError(submitError.message);
      setSelected(null);
      if (answerSaved) {
        // The answer is kept. The scene is hidden by now, so resetting it is invisible; Retry continues.
        setSaveState('idle');
        setGameRunId((previous) => previous + 1);
      } else {
        // The save failed: the runner walks back smoothly instead of being reset.
        setSaveState('failed');
      }
    } finally {
      submittingRef.current = false;
      setTransitioning(false);
      setIsSubmitting(false);
    }
  };

  const finishFeatureChallenge = useCallback(() => {
    if (usageOccasionPending) {
      setUsageOccasionPending(false);
      setScreen('usageOccasion');
    } else if (sweetnessDialPending && !sweetnessDialSaved) {
      setSweetnessDialError('');
      setScreen('sweetnessDial');
    } else {
      setScreen(question ? 'game' : 'complete');
    }
  }, [question, sweetnessDialPending, sweetnessDialSaved, usageOccasionPending]);

  const advanceFromFeatureChallenge = useCallback(() => {
    featureChallengeExpiredRef.current = true;
    if (featureChallengeSaving || (featureChallengeChoice && !featureChallengeSaved)) return;
    finishFeatureChallenge();
  }, [featureChallengeChoice, featureChallengeSaved, featureChallengeSaving, finishFeatureChallenge]);

  const saveFeatureChallenge = async (feature) => {
    if (featureChallengeSaving || featureChallengeSaved) return;
    setFeatureChallengeChoice(feature);
    setFeatureChallengeSaving(true);
    setFeatureChallengeError('');
    try {
      await researchService.submitFeatureChallenge({ sessionId, feature });
      setFeatureChallengeSaved(true);
      if (featureChallengeExpiredRef.current) finishFeatureChallenge();
    } catch (saveError) {
      setFeatureChallengeError(`We couldn't save your choice (${saveError.message}). Tap your feature again to retry.`);
    } finally {
      setFeatureChallengeSaving(false);
    }
  };

  const saveUsageResponse = async (location, response) => {
    await researchService.submitUsageOccasion({ sessionId, location, response });
    setUsageResponses((previous) => ({ ...previous, [location]: response }));
  };

  const completeUsageLocation = (location) => {
    setCompletedUsageLocations((previous) => (
      previous.includes(location) ? previous : [...previous, location]
    ));
  };

  const continueAfterUsageOccasion = () => {
    if (sweetnessDialPending && !sweetnessDialSaved) {
      setSweetnessDialError('');
      setScreen('sweetnessDial');
    } else {
      setScreen(question ? 'game' : 'complete');
    }
  };

  const saveSweetnessDial = async (level) => {
    if (sweetnessDialSaving || sweetnessDialSaved) return;
    setSweetnessDialLevel(level);
    setSweetnessDialSaving(true);
    setSweetnessDialError('');
    try {
      await researchService.submitSweetnessDial({ sessionId, level });
      setSweetnessDialSaved(true);
      setSweetnessDialPending(false);
      setScreen(question ? 'game' : 'complete');
    } catch (saveError) {
      setSweetnessDialError(`We couldn't save your sweetness preference (${saveError.message}). Please try again.`);
    } finally {
      setSweetnessDialSaving(false);
    }
  };

  const goBack = useCallback(() => {
    if (!transitioning && !isSubmitting && answers.length === 0) {
      setScreen('character');
    }
  }, [answers.length, isSubmitting, transitioning]);

  useEffect(() => {
    const handleKey = (event) => {
      if (screen !== 'game' || transitioning || timerPaused || !current) return;
      if (/^[1-9]$/.test(event.key)) {
        const option = current.options[Number(event.key) - 1];
        if (option) chooseDoor(option);
      }
      if (event.key === 'Escape') goBack();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [chooseDoor, current, goBack, screen, timerPaused, transitioning]);

  const selectedOptions = Array.isArray(selected) ? selected : selected ? [selected] : [];
  const isMultipleChoice = current?.questionType === 'multiple_choice';
  const isManualQuestion = isMultipleChoice || current?.questionType === 'price_input';
  const canSubmitManual = isMultipleChoice
    ? selectedOptions.length > 0
    : Boolean(priceAnswer) && Number.isFinite(Number(priceAnswer)) && Number(priceAnswer) >= 0;
  // Picking a single-choice door submits it straight away, so the player never has to press a button.
  useEffect(() => {
    if (!selected || Array.isArray(selected) || isManualQuestion || responseSaved || isSubmitting || transitioning) return;
    enterDoor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // Multiple-choice and price answers save on their own once the player pauses, so no button is needed.
  // The wheel saves only when the player keeps a price; typed amounts keep the pause-to-save behaviour.
  const autoSaveReady = isManualQuestion && !responseSaved && canSubmitManual && (current?.questionType !== 'price_input' || typedPrice);
  const autoSaveDelay = current?.questionType === 'price_input' ? PRICE_AUTO_SAVE_MS : MULTI_AUTO_SAVE_MS;
  useEffect(() => {
    // After a failed save, don't retry on a timer; the player retries by changing the answer or pressing Enter.
    if (!autoSaveReady || isSubmitting || transitioning || timerPaused || resuming || saveState === 'failed') return undefined;
    const timerId = window.setTimeout(() => { enterDoor(); }, autoSaveDelay);
    return () => window.clearTimeout(timerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSaveReady, autoSaveDelay, selected, priceAnswer, isSubmitting, transitioning, timerPaused, resuming, saveState, current?.id]);

  const selectionLabel = current?.questionType === 'price_input'
    ? (priceAnswer ? `₹${priceAnswer}` : 'Enter a price')
    : selectedOptions.length
      ? selectedOptions.map((option) => option.label).join(', ')
      : 'Choose an answer';
  const questionTypeLabel = isMultipleChoice
    ? 'Choose all that apply'
    : current?.questionType === 'price_input'
      ? 'Spin to pick a price'
      : current?.questionType === 'likert'
        ? 'Pick a point on the scale'
        : current?.options.length === 2 ? 'Pick one of two' : 'Choose one door';
  const priceInvalid = priceAnswer !== '' && !canSubmitManual && current?.questionType === 'price_input';

  return <main className={`game-shell ${transitioning ? 'scene-transitioning' : ''}`}>
    <div className="world-backdrop" />
    <div className="world-vignette" />
    <header className="top-hud">
      <button className="brand-mark" onClick={() => setScreen('welcome')} aria-label="ChocoWarm home"><span className="brand-heart">H</span><span><strong>ChocoWarm</strong><small>Your Hot Chocolate</small></span></button>
      {screen === 'game' && <div className="journey-meter"><div className="meter-title"><Sparkles size={17}/><span className="destination-name">{DESTINATIONS[Math.min(Math.floor(answers.length / 6), DESTINATIONS.length - 1)].name}</span><b>{progress.completed}/{progress.total}</b></div><div className="meter-segments" role="progressbar" aria-label="Survey progress" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.completed}>{Array.from({ length: progress.total }, (_, index) => <span key={index} className={index < progress.completed ? 'segment-done' : index === progress.completed ? 'segment-current' : ''} />)}</div><ChapterTrail currentIndex={Math.min(Math.floor(answers.length / 6), DESTINATIONS.length - 1)} /></div>}
      <div className="top-actions">{screen === 'game' && <><div className="game-clock"><Timer size={16}/><span>{formattedTime}</span></div><button className="timer-toggle" onClick={() => { if (timerPaused) sfx.resume(); else sfx.pause(); setTimerPaused(!timerPaused); }} aria-label={timerPaused ? 'Resume game timer' : 'Pause game timer'}>{timerPaused ? <Play size={17}/> : <Pause size={17}/>}<span>{timerPaused ? 'Resume' : 'Pause'}</span></button><div className="spark-counter"><Sparkles size={16}/><span>{answers.length} stars</span></div></>}<button className="round-control" onClick={() => setSoundOn(v => !v)} aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}>{soundOn ? <Volume2/> : <VolumeX/>}</button></div>
    </header>

    {screen === 'introduction' && <RespondentIntro
      initialProfile={respondentProfile}
      onStart={(profile) => {
        setRespondentProfile(profile);
        window.localStorage.setItem(RESPONDENT_PROFILE_KEY, JSON.stringify(profile));
        setError('');
        setScreen('welcome');
      }}
    />}
    {screen === 'usageOccasion' && <UsageOccasionGame
      responses={usageResponses}
      completedLocations={completedUsageLocations}
      onAnswer={saveUsageResponse}
      onComplete={completeUsageLocation}
      onContinue={continueAfterUsageOccasion}
    />}
    {screen === 'sweetnessDial' && <SweetnessDial
      initialLevel={sweetnessDialLevel}
      isSaving={sweetnessDialSaving}
      error={sweetnessDialError}
      onSave={saveSweetnessDial}
    />}
    {screen === 'featureChallenge' && <FeatureChallenge
      durationSeconds={FEATURE_CHALLENGE_SECONDS}
      selectedFeature={featureChallengeChoice}
      isSaving={featureChallengeSaving}
      isSaved={featureChallengeSaved}
      error={featureChallengeError}
      onSelect={saveFeatureChallenge}
      onExpire={advanceFromFeatureChallenge}
    />}
    {screen === 'welcome' && <section className="welcome-scene"><div className="welcome-copy"><h1>Choose your<br/><em>hot chocolate moment</em></h1><p>Answer a few quick questions and discover your perfect cup.</p><button className="gold-cta" onClick={startJourney}>{canResume ? 'Continue journey' : 'Lets go'} <ArrowRight size={18}/></button>{canResume && <button className="back-link" onClick={restartJourney}>Start over</button>}<div className="welcome-meta"><span>About 5 minutes</span><span>25 questions</span></div></div><div className="welcome-character welcome-emoji"></div><div className="welcome-hint"><Compass size={17}/> Your answer matters</div></section>}

    {screen === 'character' && <section className="character-select-scene"><div className="character-select-copy"><h1>Choose your<br/><em>runner</em></h1><p>Pick a character for your hot chocolate adventure.</p></div><div className="character-options">{[{id:'boy',name:'The Explorer',desc:'Brave, curious, ready to discover',icon:Compass,tone:'blue'},{id:'girl',name:'The Adventurer',desc:'Energetic, daring, full of spirit',icon:Mountain,tone:'pink'}].map(c=><button key={c.id} className={`character-choice ${characterId===c.id?'character-choice-active':''} character-${c.tone}`} onClick={()=>setCharacterId(c.id)}><span className="character-art character-icon" aria-hidden="true"><c.icon size={44} strokeWidth={2.2} /></span><strong>{c.name}</strong><small>{c.desc}</small><span className="character-select-status">{characterId===c.id?'Selected':'Choose'}</span></button>)}</div>{error && <div className="inline-error character-error">{error}</div>}<div className="character-select-bottom"><button className="gold-cta" onClick={beginAdventure} disabled={isStarting}>{isStarting ? <><span className="spinner" aria-hidden="true"/> Connecting…</> : 'Start journey'} <ArrowRight size={18}/></button></div></section>}

    {screen === 'game' && current && !SUPPORTED_QUESTION_TYPES.includes(current.questionType) && <section className="complete-scene"><span className="eyebrow">Question not supported</span><h1>This question<br/><em>needs an update</em></h1><p>The survey sent a question type this version cannot show. Start over to continue.</p><button className="gold-cta" onClick={restartJourney}>Start over</button></section>}
    {screen === 'game' && current && SUPPORTED_QUESTION_TYPES.includes(current.questionType) && <section className="game-scene">
      <div className="question-banner" key={current.id}><div className="question-cup"><Coffee size={27}/></div><div className="question-content"><span className="eyebrow">{current.place} · {questionTypeLabel}</span><h2>{current.question}</h2><p>{current.helper}</p></div><span className="question-glint glint-left">*</span><span className="question-glint glint-right">*</span></div>
      {/* The 3D scene stays mounted for every question; price questions simply show no doors. */}
      <RunnerWorld characterId={characterId} season={selectedSeason} options={current.questionType === 'price_input' || current.questionType === 'ranking' ? NO_OPTIONS : current.options} selected={selected} multiSelect={isMultipleChoice} isPaused={timerPaused} onChoose={chooseDoor} onRunComplete={handleRunComplete} onSceneReady={handleSceneReady} saveState={saveState} zoneIndex={Math.floor(answers.length / 6)} sceneKey={`${current.id}-${gameRunId}`} />
      {current.questionType === 'ranking' && !responseSaved && <RankingPanel options={current.options} saving={isSubmitting || transitioning} error={error} onSubmit={(items) => enterDoor(items)} />}
      {current.questionType === 'price_input' && !typedPrice && <PriceWheel saving={isSubmitting || transitioning} error={error} reducedMotion={typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches} onConfirm={(value) => { setPriceAnswer(String(value)); enterDoor(value); }} onTypeInstead={() => setTypedPrice(true)} />}
      {current.questionType === 'price_input' && typedPrice && <div className="price-answer-panel"><label htmlFor="price-answer">Your price in rupees</label><div className="price-input-wrap"><span aria-hidden="true">₹</span><input id="price-answer" type="number" inputMode="decimal" min="0" step="0.01" aria-describedby="price-hint" aria-invalid={priceInvalid} value={priceAnswer} onChange={(event) => { setPriceAnswer(event.target.value); setSaveState((state) => (state === 'failed' ? 'idle' : state)); }} onKeyDown={(event) => { if (event.key === 'Enter' && canSubmitManual) enterDoor(); }} disabled={isSubmitting || responseSaved || timerPaused} /></div><p id="price-hint" className={priceInvalid ? 'price-error' : 'price-hint'}>{priceInvalid ? 'Enter an amount of 0 or more.' : 'Saves automatically when you pause, or press Enter.'}</p></div>}
      <AnimatePresence>{chapterToast && <motion.div key={chapterToast} className="chapter-toast" role="status" aria-live="polite" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}><Sparkles size={16} aria-hidden="true"/> {chapterToast}</motion.div>}</AnimatePresence>
      {resuming && <div className="resume-shade" role="status" aria-live="polite"><span className="spinner" aria-hidden="true"/> Resuming your journey…</div>}
      {/* Screen-reader and keyboard access to the same answers the doors show. */}
      <div className="sr-only">{current.questionType !== 'ranking' && current.options.map((option, index) => <button key={option.id} type="button" onClick={() => chooseDoor(option)} disabled={isSubmitting || transitioning || responseSaved || timerPaused} aria-pressed={isMultipleChoice ? selectedOptions.some((item) => item.id === option.id) : undefined}>{`Option ${index + 1}: ${option.label}`}</button>)}</div>
      <div className="scene-footer"><button className="round-back" onClick={goBack} aria-label="Go back" disabled={answers.length > 0 || isSubmitting}><ArrowLeft size={21}/></button><div className="place-chip"><span className="place-icon"><Compass size={25}/></span><span><strong>{current.place}</strong><AnimatePresence mode="wait" initial={false}><motion.small key={selectionLabel} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>{selectionLabel}</motion.small></AnimatePresence></span></div><div className="move-hint">{current.options.slice(0, 5).map((option, index) => <span className="keycap" key={option.id}>{index + 1}</span>)}<small>{isMultipleChoice ? `${selectedOptions.length} picked · saves automatically` : 'Choose'}</small></div>{responseSaved && <button className="enter-cta" onClick={enterDoor} disabled={isSubmitting || transitioning}>{isSubmitting ? 'Saving...' : 'Retry'} <ArrowRight size={17}/></button>}</div>
      {(saveState === 'saving' || saveState === 'saved') && <div className={`run-status ${saveState === 'saved' ? 'is-saved' : ''}`} role="status" aria-live="polite">{saveState === 'saving' ? <><span className="spinner" aria-hidden="true"/> Saving your answer…</> : <><Check size={15} aria-hidden="true"/> Answer saved</>}</div>}
      {error && <div className="inline-error" role="alert">{error}</div>}
      {timerPaused && <div className="pause-shade"><section className="pause-card"><span className="eyebrow">TAKE A BREATHER</span><h2>Adventure paused</h2><p>Your timer and the world are paused. Pick up where you left off whenever you’re ready.</p><button className="gold-cta" onClick={() => { sfx.resume(); setTimerPaused(false); }}><Play size={17}/> Resume adventure</button></section></div>}
    </section>}

    {screen === 'complete' && <section className={`complete-scene ${completionStatus === 'ineligible' ? 'complete-ineligible' : ''}`}>
      <div className="cafe-completion-card">
        <div className="cafe-completion-sign">COCOA HOUSE <span>·</span> YOUR COZY CORNER</div>
        <div className="cafe-cup-art" aria-hidden="true">
          <span className="cafe-cup-steam cafe-cup-steam-one" />
          <span className="cafe-cup-steam cafe-cup-steam-two" />
          <span className="cafe-cup-steam cafe-cup-steam-three" />
          <span className="cafe-cup-sleeve">COCOA</span>
          <Coffee size={74} strokeWidth={1.45} />
          <span className="cafe-cup-saucer" />
          <Sparkles className="cafe-cup-glint" size={20} />
        </div>
        <span className="eyebrow">{completionStatus === 'ineligible' ? 'THANKS FOR STOPPING BY' : 'ORDER COMPLETE · TABLE 01'}</span>
        <h1>
          {completionStatus === 'ineligible'
            ? <>Thanks for<br/><em>your interest</em></>
            : <>Your cocoa moment<br/><em>is ready</em></>}
        </h1>
        <p>{completionStatus === 'ineligible'
          ? 'This survey is intended for respondents aged 18 and above.'
          : 'Thanks for helping us make every cup a little cozier.'}</p>
        {completionStatus !== 'ineligible' && <div className="cafe-ready-note"><span className="cafe-ready-dot" /> Freshly brewed vibes. Cozy era unlocked.</div>}
        <div className="completion-stats">
          <span><strong>{answers.length}</strong><small>answers shared</small></span>
          <span><strong>{totalQuestions}</strong><small>survey questions</small></span>
          <span><strong>♥</strong><small>warmth added</small></span>
        </div>
        <button className="gold-cta" onClick={() => { clearJourney(); setScreen('welcome'); }}>
          One more cup <RotateCcw size={17}/>
        </button>
      </div>
    </section>}
    <div className="bottom-slogan"><span>*</span> SMALL CHOICES BIG DIFFERENCE <span>*</span></div>
  </main>;
}
export default App;
