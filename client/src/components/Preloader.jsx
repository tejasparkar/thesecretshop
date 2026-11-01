import { useLayoutEffect, useRef } from 'react';
import { gsap } from '../lib/gsap.js';

/** Counter 0→100 then a curtain wipe. Calls onDone when finished. Shown once per session. */
export default function Preloader({ onDone }) {
  const root = useRef(null);
  const count = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const counter = { v: 0 };
      gsap
        .timeline({ onComplete: onDone })
        .to(counter, {
          v: 100,
          duration: 1.6,
          ease: 'power2.inOut',
          onUpdate: () => {
            count.current.textContent = String(Math.round(counter.v)).padStart(3, '0');
          },
        })
        .to('.preloader__bar span', { scaleX: 1, duration: 1.6, ease: 'power2.inOut' }, 0)
        .to('.preloader__word', { yPercent: -110, duration: 0.6, ease: 'power3.in', stagger: 0.05 })
        .to(root.current, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'power4.inOut' }, '-=0.2');
    }, root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="preloader" ref={root}>
      <div className="preloader__words">
        {['The', 'Secret', 'Shop'].map((w) => (
          <span className="line" key={w}>
            <span className="preloader__word">{w}</span>
          </span>
        ))}
      </div>
      <div className="preloader__foot">
        <div className="preloader__bar"><span /></div>
        <span className="preloader__count" ref={count}>000</span>
      </div>
    </div>
  );
}
