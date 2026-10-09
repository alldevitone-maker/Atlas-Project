import { useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';

/** A shared pointer gesture: positive movement opens a horizontal panel and closes a vertical one. */
export function PanelHandle({ axis, expanded, onChange, controls, label, onDrag, className = '' }: {
  axis: 'horizontal' | 'vertical'; expanded: boolean; onChange: (value: boolean) => void;
  controls: string; label: string; onDrag?: (offset: number) => void; className?: string;
}) {
  const gesture = useRef<{ id: number; start: number; delta: number } | null>(null);
  const suppressClick = useRef(false);
  const [offset, setOffset] = useState(0);
  const coordinate = (event: PointerEvent<HTMLButtonElement>) => axis === 'horizontal' ? event.clientX : event.clientY;
  const finish = (event: PointerEvent<HTMLButtonElement>, cancelled = false) => {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    gesture.current = null;
    setOffset(0);
    onDrag?.(0);
    suppressClick.current = Math.abs(current.delta) > 8;
    if (!cancelled && Math.abs(current.delta) >= 32) onChange(axis === 'horizontal' ? current.delta > 0 : current.delta < 0);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return <button type="button" className={`panel-handle ${axis} ${className}`} aria-label={label}
    aria-expanded={expanded} aria-controls={controls} style={{ '--drag-offset': `${offset}px` } as CSSProperties}
    onPointerDown={event => {
      if (!event.isPrimary || event.button !== 0) return;
      suppressClick.current = false;
      gesture.current = { id: event.pointerId, start: coordinate(event), delta: 0 };
      event.currentTarget.setPointerCapture(event.pointerId);
    }}
    onPointerMove={event => {
      const current = gesture.current;
      if (!current || current.id !== event.pointerId) return;
      current.delta = coordinate(event) - current.start;
      onDrag?.(current.delta);
      setOffset(Math.max(-24, Math.min(24, current.delta)));
    }}
    onPointerUp={event => finish(event)} onPointerCancel={event => finish(event, true)}
    onLostPointerCapture={event => finish(event, true)}
    onClick={event => {
      if (event.detail !== 0 && suppressClick.current) { suppressClick.current = false; return; }
      onChange(!expanded);
    }}>
    <svg aria-hidden="true" viewBox="0 0 24 24" className={expanded ? 'expanded' : ''}><path d="m8 5 7 7-7 7" /></svg>
  </button>;
}
