// Small sound effects synthesized with the Web Audio API. No audio files or dependencies.
// The AudioContext is created on first use; browsers only start it after a user interaction,
// which the first door pick or sound toggle provides.

let context = null;
let enabled = true;

function ensureContext() {
  if (!context) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
  }
  if (context.state === 'suspended') context.resume().catch(() => {});
  return context;
}

// The audio context is created on the first sound, which only happens after a user action.
export function setSoundEnabled(on) {
  enabled = on;
}

function tone({ freq, to, duration = 0.2, type = 'sine', gain = 0.15, delay = 0 }) {
  const ctx = ensureContext();
  if (!ctx || !enabled) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, start + duration);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(amp).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

// A short filtered noise sweep, used for the rush through a door.
function whoosh({ duration = 0.5, gain = 0.1 } = {}) {
  const ctx = ensureContext();
  if (!ctx || !enabled) return;
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(400, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + duration);
  const amp = ctx.createGain();
  amp.gain.value = gain;
  source.connect(filter).connect(amp).connect(ctx.destination);
  source.start();
}

export const sfx = {
  // A soft wooden tick when a door or answer is picked.
  pick() {
    tone({ freq: 620, to: 780, duration: 0.09, type: 'triangle', gain: 0.16 });
  },
  // Running through a door: a whoosh and a rising chime.
  pass() {
    whoosh({ duration: 0.45, gain: 0.08 });
    tone({ freq: 440, to: 1320, duration: 0.35, type: 'sine', gain: 0.1, delay: 0.05 });
  },
  // Answer saved: two bright notes.
  saved() {
    tone({ freq: 784, duration: 0.14, type: 'triangle', gain: 0.14 });
    tone({ freq: 1046, duration: 0.22, type: 'triangle', gain: 0.14, delay: 0.09 });
  },
  // Save failed: a low, short dip.
  error() {
    tone({ freq: 230, to: 170, duration: 0.25, type: 'square', gain: 0.06 });
  },
  // Journey complete: a small arpeggio.
  complete() {
    [523, 659, 784, 1046].forEach((freq, index) => {
      tone({ freq, duration: 0.3, type: 'triangle', gain: 0.13, delay: index * 0.12 });
    });
  },
  // Start of the adventure.
  start() {
    tone({ freq: 392, to: 523, duration: 0.2, type: 'triangle', gain: 0.13 });
  },
  // Pause and resume, gentle in either direction.
  pause() {
    tone({ freq: 523, to: 392, duration: 0.18, type: 'sine', gain: 0.1 });
  },
  resume() {
    tone({ freq: 392, to: 523, duration: 0.18, type: 'sine', gain: 0.1 });
  },
};
