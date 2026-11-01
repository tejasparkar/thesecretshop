import { useLayoutEffect } from 'react';
import { gsap, prefersReducedMotion } from '../lib/gsap.js';

/**
 * Generic scroll reveals for any page. Inside `scopeRef`:
 *  [data-reveal]          fade + rise when entering the viewport
 *  [data-reveal="lines"]  children .line-inner slide up from a mask
 *  [data-parallax="0.2"]  vertical parallax, value = strength
 */
export default function useReveal(scopeRef, deps = []) {
  useLayoutEffect(() => {
    if (!scopeRef.current || prefersReducedMotion()) return undefined;

    const ctx = gsap.context(() => {
      gsap.utils.toArray('[data-reveal]:not([data-reveal="lines"])').forEach((el) => {
        gsap.from(el, {
          y: 60,
          opacity: 0,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        });
      });

      gsap.utils.toArray('[data-reveal="lines"]').forEach((el) => {
        gsap.from(el.querySelectorAll('.line-inner'), {
          yPercent: 110,
          duration: 1.1,
          ease: 'power4.out',
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: 'top 85%' },
        });
      });

      gsap.utils.toArray('[data-parallax]').forEach((el) => {
        const strength = parseFloat(el.dataset.parallax) || 0.2;
        gsap.fromTo(
          el,
          { yPercent: -strength * 50 },
          {
            yPercent: strength * 50,
            ease: 'none',
            scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
          }
        );
      });
    }, scopeRef);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
