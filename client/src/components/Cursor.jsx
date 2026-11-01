import { useEffect, useRef } from 'react';
import { gsap } from '../lib/gsap.js';

/**
 * Custom blended cursor. Grows over links/buttons; elements with
 * data-cursor="View" show that label inside the cursor.
 */
export default function Cursor() {
  const dot = useRef(null);
  const label = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return undefined;
    document.documentElement.classList.add('has-cursor');

    const el = dot.current;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3' });

    const move = (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    const over = (e) => {
      const target = e.target.closest('[data-cursor], a, button, input, select, textarea, label');
      el.classList.toggle('is-hover', Boolean(target));
      const text = target?.dataset?.cursor || '';
      label.current.textContent = text;
      el.classList.toggle('has-label', Boolean(text));
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', over);
    return () => {
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', over);
    };
  }, []);

  return (
    <div className="cursor" ref={dot} aria-hidden="true">
      <span ref={label} />
    </div>
  );
}
