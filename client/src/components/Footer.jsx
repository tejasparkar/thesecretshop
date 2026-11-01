import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap, prefersReducedMotion } from '../lib/gsap.js';
import Magnetic from './Magnetic.jsx';

export default function Footer() {
  const ref = useRef(null);

  // Footer slides up from underneath the page as you reach the bottom.
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.from('.footer__inner', {
        yPercent: -40,
        ease: 'none',
        scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom bottom', scrub: true },
      });
      gsap.from('.footer__big span', {
        yPercent: 100,
        stagger: 0.04,
        ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 70%', end: 'bottom bottom', scrub: 1 },
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <footer className="footer" ref={ref}>
      <div className="footer__inner">
        <div className="footer__top">
          <div>
            <p className="eyebrow">Got a build in mind?</p>
            <h3 className="footer__cta">Let's spec your <em>dream machine.</em></h3>
            <Magnetic>
              <Link to="/shop" className="round-btn" data-cursor="Go">Start<br />shopping</Link>
            </Magnetic>
          </div>
          <div className="footer__cols">
            <div>
              <p className="eyebrow">Shop</p>
              <Link to="/shop">All products</Link>
              <Link to="/shop/gaming-pcs">Gaming PCs</Link>
              <Link to="/shop/graphics-cards">Graphics cards</Link>
              <Link to="/shop/peripherals">Peripherals</Link>
            </div>
            <div>
              <p className="eyebrow">Help</p>
              <Link to="/account/orders">Track order</Link>
              <a href="#shipping">Shipping & returns</a>
              <a href="#warranty">2-year warranty</a>
            </div>
            <div>
              <p className="eyebrow">Visit</p>
              <p>Open Mon–Sat<br />10:00 – 20:00 IST</p>
            </div>
          </div>
        </div>
        <div className="footer__big" aria-hidden="true">
          {[...'thesecretshop'].map((c, i) => <span key={i}>{c}</span>)}
        </div>
        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} The Secret Shop</span>
          <span>Built for builders.</span>
        </div>
      </div>
    </footer>
  );
}
