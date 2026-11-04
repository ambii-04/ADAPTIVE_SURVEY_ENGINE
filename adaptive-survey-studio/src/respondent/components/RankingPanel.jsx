import { useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';

// Ranking question: drag an item to reorder it, or tap the arrows (the mobile-friendly alternative).
// The submitted answer is the full ordering, most important first, as option ids.
export default function RankingPanel({ options, onSubmit, saving, error }) {
  const [order, setOrder] = useState(() => options.map((option) => option.id));
  const [dragging, setDragging] = useState(null);
  const labelFor = (id) => options.find((option) => option.id === id)?.label ?? id;

  const move = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= order.length || fromIndex === toIndex) return;
    setOrder((current) => {
      const next = [...current];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  return <section className="rank-panel" aria-label="Rank these options">
    <span className="eyebrow">Rank in order</span>
    <p className="rank-hint">Drag to reorder, or use the arrows. Most important first.</p>
    <ol className="rank-list">
      {order.map((id, index) => (
        <li
          key={id}
          className={`rank-item ${dragging === index ? 'is-dragging' : ''}`}
          draggable={!saving}
          onDragStart={() => setDragging(index)}
          onDragOver={(event) => {
            event.preventDefault();
            if (dragging !== null && dragging !== index) {
              move(dragging, index);
              setDragging(index);
            }
          }}
          onDragEnd={() => setDragging(null)}
        >
          <span className="rank-grip" aria-hidden="true"><GripVertical size={16} /></span>
          <span className="rank-number">{index + 1}</span>
          <span className="rank-label">{labelFor(id)}</span>
          <span className="rank-arrows">
            <button type="button" aria-label={`Move ${labelFor(id)} up`} onClick={() => move(index, index - 1)} disabled={saving || index === 0}><ArrowUp size={16} /></button>
            <button type="button" aria-label={`Move ${labelFor(id)} down`} onClick={() => move(index, index + 1)} disabled={saving || index === order.length - 1}><ArrowDown size={16} /></button>
          </span>
        </li>
      ))}
    </ol>
    <button type="button" className="enter-cta" disabled={saving} onClick={() => onSubmit(order.map((id) => options.find((option) => option.id === id)))}>
      {saving ? 'Saving...' : 'Save ranking'}
    </button>
    {error && <p className="rank-error" role="alert">{error}</p>}
  </section>;
}
