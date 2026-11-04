import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { DESTINATIONS } from './Destinations.jsx';

// Quest-style trail: one node per chapter (destination), linked in order.
// Finished chapters show a check, the current one pulses, and the rest stay dim.
export default function ChapterTrail({ currentIndex }) {
  return <ol className="chapter-trail" aria-label="Chapter progress">
    {DESTINATIONS.map((destination, index) => {
      const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo';
      return <li key={destination.name} className={`chapter-node chapter-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
        <motion.span
          className="chapter-dot"
          style={{ background: state === 'todo' ? undefined : destination.light }}
          animate={state === 'current' ? { scale: [1, 1.25, 1] } : { scale: 1 }}
          transition={state === 'current' ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
        >
          {state === 'done' ? <Check size={14} aria-hidden="true" /> : index + 1}
        </motion.span>
        <span className="chapter-name">{destination.name}</span>
        {index < DESTINATIONS.length - 1 && <span className={`chapter-link ${state === 'done' ? 'is-done' : ''}`} aria-hidden="true" />}
      </li>;
    })}
  </ol>;
}
