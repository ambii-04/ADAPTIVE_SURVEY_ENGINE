import { useEffect, useState } from 'react';
import { animate, motion, useMotionValue } from 'motion/react';

// Price options on the wheel, in rupees. The player picks one by stopping the wheel on it.
export const PRICE_SEGMENTS = [150, 200, 250, 300, 350, 400];
const SEGMENT_COLORS = ['#f3e1c6', '#d9a86c', '#f7e9d6', '#b9824f', '#eccba0', '#c99260'];
const SEG = 360 / PRICE_SEGMENTS.length;
const SIZE = 260;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 6;

// Angles are measured clockwise from the top. The pointer sits at the top.
const pointOn = (angle, radius) => {
  const radians = (angle * Math.PI) / 180;
  return [CENTER + radius * Math.sin(radians), CENTER - radius * Math.cos(radians)];
};

const segmentPath = (index) => {
  const start = index * SEG;
  const end = start + SEG;
  const [x1, y1] = pointOn(start, RADIUS);
  const [x2, y2] = pointOn(end, RADIUS);
  const largeArc = SEG > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`;
};

// Index of the segment under the pointer for a given wheel rotation.
export const segmentUnderPointer = (rotation) => {
  const angle = (((360 - (rotation % 360)) % 360) + 360) % 360;
  return Math.floor(angle / SEG) % PRICE_SEGMENTS.length;
};

// Degrees to add so that the centre of the segment under the pointer lands on the pointer.
const snapDelta = (rotation) => {
  const angle = (((360 - (rotation % 360)) % 360) + 360) % 360;
  const centre = Math.floor(angle / SEG) * SEG + SEG / 2;
  return (((angle - centre) % 360) + 360) % 360;
};

export default function PriceWheel({ onConfirm, onTypeInstead, saving, error, reducedMotion }) {
  const rotate = useMotionValue(0);
  const [spinning, setSpinning] = useState(false);
  const [picked, setPicked] = useState(null);
  const [snapping, setSnapping] = useState(false);

  // Keep a spin going while it is on; the motion value is shared with the wheel.
  useEffect(() => {
    if (!spinning) return undefined;
    const controls = animate(rotate, rotate.get() + 360 * 40, {
      duration: reducedMotion ? 1 : 40,
      ease: 'linear',
    });
    return () => controls.stop();
  }, [spinning, rotate, reducedMotion]);

  const spin = () => {
    setPicked(null);
    setSpinning(true);
  };

  const stop = () => {
    if (!spinning || snapping) return;
    setSpinning(false);
    setSnapping(true);
    // Stop where the wheel is now, then ease forward to the centre of the segment under the pointer.
    const current = rotate.get();
    const target = current + snapDelta(current);
    animate(rotate, target, {
      duration: reducedMotion ? 0.2 : 0.9,
      ease: 'easeOut',
      onComplete: () => {
        setSnapping(false);
        setPicked(segmentUnderPointer(target));
      },
    });
  };

  const toggle = () => (spinning ? stop() : spin());

  const value = picked === null ? null : PRICE_SEGMENTS[picked];

  return <section className="price-wheel" aria-label="Price wheel">
    <div className="wheel-stage">
      <div className="wheel-pointer" aria-hidden="true" />
      <motion.div className="wheel" style={{ rotate }} aria-hidden="true">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" height="100%">
          {PRICE_SEGMENTS.map((price, index) => {
            const mid = index * SEG + SEG / 2;
            const [lx, ly] = pointOn(mid, RADIUS * 0.62);
            return <g key={price}>
              <path d={segmentPath(index)} fill={SEGMENT_COLORS[index % SEGMENT_COLORS.length]} stroke="#6b3e22" strokeWidth="2" />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" transform={`rotate(${mid} ${lx} ${ly})`} className="wheel-label">
                {`₹${price}`}
              </text>
            </g>;
          })}
          <circle cx={CENTER} cy={CENTER} r="18" fill="#4a2c1a" stroke="#f3e1c6" strokeWidth="3" />
        </svg>
      </motion.div>
    </div>

    <p className="wheel-status" role="status" aria-live="polite">
      {spinning ? 'Tap Stop when the wheel is on the price you would pay.'
        : snapping ? 'Stopping…'
        : value !== null ? `You picked ₹${value}.`
        : 'Tap Spin, then tap Stop on the price you would pay.'}
    </p>

    <div className="wheel-actions">
      <button type="button" className="enter-cta" onClick={toggle} disabled={saving || snapping}>
        {spinning ? 'Stop' : 'Spin'}
      </button>
      {value !== null && !spinning && <>
        <button type="button" className="drink-secondary" onClick={spin} disabled={saving}>Spin again</button>
        <button type="button" className="enter-cta" onClick={() => onConfirm(value)} disabled={saving}>
          {saving ? 'Saving...' : `Keep ₹${value}`}
        </button>
      </>}
    </div>

    <button type="button" className="wheel-type-link" onClick={onTypeInstead} disabled={saving || spinning}>
      Type an amount instead
    </button>
    {error && <p className="rank-error" role="alert">{error}</p>}
  </section>;
}
