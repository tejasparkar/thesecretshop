import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import api from '../lib/api.js';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap.js';
import useSmoothScroll, { getLenis } from '../hooks/useSmoothScroll.js';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import CartDrawer from './CartDrawer.jsx';
import Cursor from './Cursor.jsx';
import Preloader from './Preloader.jsx';

export default function StoreLayout() {
  useSmoothScroll();
  const { pathname } = useLocation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(
    () => pathname === '/' && !sessionStorage.getItem('tss_loaded') && !prefersReducedMotion()
  );
  const curtain = useRef(null);
  const first = useRef(true);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  // Route change: jump to top, play a curtain wipe, refresh scroll triggers.
  useLayoutEffect(() => {
    getLenis()?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
    if (first.current) {
      first.current = false;
      return;
    }
    if (!prefersReducedMotion()) {
      gsap.fromTo(
        curtain.current,
        { scaleY: 1, transformOrigin: 'top' },
        { scaleY: 0, duration: 0.8, ease: 'power4.inOut' }
      );
    }
    const id = setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => clearTimeout(id);
  }, [pathname]);

  return (
    <div className="store">
      <Cursor />
      {loading && (
        <Preloader
          onDone={() => {
            sessionStorage.setItem('tss_loaded', '1');
            setLoading(false);
          }}
        />
      )}
      <div className="route-curtain" ref={curtain} />
      <Header categories={categories} />
      <main>
        <Outlet context={{ categories, introDone: !loading }} />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
