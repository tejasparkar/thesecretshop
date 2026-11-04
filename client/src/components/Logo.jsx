import { useId } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getLenis } from '../hooks/useSmoothScroll.js';
import usePress from '../hooks/usePress.js';
import { prefersReducedMotion } from '../lib/gsap.js';

/**
 * Vector brand mark: an isometric keycap + Cinzel wordmark.
 * Clicking it presses the key down; on the home page it then glides back to the top
 * (other pages navigate home, where StoreLayout resets the scroll).
 */
export default function Logo({ scrollTop = true, className = '', ...rest }) {
  const raw = useId();
  const id = (name) => `logo${raw.replace(/[^a-zA-Z0-9]/g, '')}-${name}`;
  const { pathname } = useLocation();
  const [pressed, press] = usePress();

  const onClick = (e) => {
    press();

    if (!scrollTop || pathname !== '/') return;
    e.preventDefault();
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { duration: 1.4 });
    else window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  return (
    <Link
      to="/"
      className={`logo ${pressed ? 'is-pressed' : ''} ${className}`}
      aria-label="The Secret Shop — home"
      onClick={onClick}
      data-cursor="none"
      {...rest}
    >
      <svg className="logo__mark" viewBox="-4 -4 453 338" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={id('gold')} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0" stopColor="#f6e3a8" />
            <stop offset="0.55" stopColor="#d4ab5e" />
            <stop offset="1" stopColor="#a87a30" />
          </linearGradient>
          <linearGradient id={id('left')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2a1f38" />
            <stop offset="1" stopColor="#16111d" />
          </linearGradient>
          <linearGradient id={id('right')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#141017" />
            <stop offset="1" stopColor="#0c0a0f" />
          </linearGradient>
          <radialGradient id={id('top')} cx="0.5" cy="0.5" r="0.55">
            <stop offset="0" stopColor="#6b4a9c" />
            <stop offset="0.6" stopColor="#2b1d40" />
            <stop offset="1" stopColor="#1a1226" />
          </radialGradient>
        </defs>

        {/* switch housing: stays put while the cap travels */}
        <path className="logo__base" d="M10 197 L222 320 L435 197 L222 74 Z" />

        <g className="logo__cap" stroke={`url(#${id('gold')})`} strokeWidth="11" strokeLinejoin="round">
          <path d="M78 92 L222 172 L222 310 L10 187 Z" fill={`url(#${id('left')})`} />
          <path d="M222 172 L365 92 L435 187 L222 310 Z" fill={`url(#${id('right')})`} />
          <path d="M222 10 L365 92 L222 172 L78 92 Z" fill={`url(#${id('top')})`} />
          <path d="M222 31 L328 92 L222 152 L115 92 Z" fill="none" stroke="#b894e6" strokeWidth="6" />
          <path
            className="logo__spark"
            d="M222 54 Q228 86 260 92 Q228 98 222 130 Q216 98 184 92 Q216 86 222 54 Z"
            fill="#f6f0ff"
            stroke="none"
          />
        </g>
      </svg>

      <span className="logo__word" aria-hidden="true">
        <span className="logo__line">The <b>Secret</b></span>
        <span className="logo__rule"><i /><svg viewBox="0 0 20 20"><path d="M10 0 Q11.5 8.5 20 10 Q11.5 11.5 10 20 Q8.5 11.5 0 10 Q8.5 8.5 10 0 Z" /></svg><i /></span>
        <span className="logo__line">Shop</span>
      </span>
    </Link>
  );
}
