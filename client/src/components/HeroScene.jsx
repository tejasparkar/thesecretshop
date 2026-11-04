import { useEffect, useRef } from 'react';
import { ScrollTrigger, prefersReducedMotion } from '../lib/gsap.js';
import { getLenis } from '../hooks/useSmoothScroll.js';
import usePress from '../hooks/usePress.js';

/*
 * Hero "hall of achievements": the glowing keycap emblem in the centre, PC-part
 * achievements floating around it, light beams rising from the floor and a
 * canvas of gold motes / lilac dust. Positions are % of the hero; mx/my are
 * the phone-layout positions (small nodes are hidden on phones).
 */

export const NODES = [
  { name: 'Cable Whisperer II', icon: 'psu', x: 10, y: 42, size: 'sm' },
  { name: 'Silicon Lottery Winner', icon: 'cpu', x: 30, y: 26, size: 'sm' },
  { name: 'Overclock Adept V', icon: 'gpu', x: 23, y: 48, size: 'lg', beam: true, mx: 20, my: 36 },
  { name: 'Airflow Architect', icon: 'fan', x: 39, y: 38, size: 'sm' },
  { name: 'Thermal Warden III', icon: 'cooler', x: 13, y: 64, size: 'md', beam: true, mx: 17, my: 56 },
  { name: 'Memory Hoarder III', icon: 'ram', x: 61, y: 27, size: 'sm' },
  { name: 'Frame Rate Ascendant VI', icon: 'monitor', x: 72, y: 47, size: 'lg', beam: true, mx: 80, my: 40 },
  { name: 'Board Architect IV', icon: 'mobo', x: 84, y: 34, size: 'md', mx: 82, my: 22 },
  { name: 'Terabyte Tycoon V', icon: 'ssd', x: 92, y: 52, size: 'sm' },
  { name: 'First Build', icon: 'tower', x: 82, y: 67, size: 'md', beam: true, mx: 82, my: 58 },
];

const FLOOR = 0.86; // floor line, as a fraction of hero height (matches CSS --floor)
const MOBILE = '(max-width: 640px)';

/* Outlined PC-part icons, drawn on a 48×48 grid. */
const ICONS = {
  gpu: 'M3 14h38v18H3zM8 23a6 6 0 1 0 12 0a6 6 0 1 0-12 0M24 23a6 6 0 1 0 12 0a6 6 0 1 0-12 0M12 23a2 2 0 1 0 4 0a2 2 0 1 0-4 0M28 23a2 2 0 1 0 4 0a2 2 0 1 0-4 0M10 32v4h18v-4M41 10v28M41 10h4',
  cpu: 'M12 12h24v24H12zM18 18h12v12H18zM16 6v6M21 6v6M27 6v6M32 6v6M16 36v6M21 36v6M27 36v6M32 36v6M6 16h6M6 21h6M6 27h6M6 32h6M36 16h6M36 21h6M36 27h6M36 32h6',
  ram: 'M3 16h42v14H3zM7 20h6v6H7zM15 20h6v6h-6zM27 20h6v6h-6zM35 20h6v6h-6zM6 30v4M10 30v4M14 30v4M18 30v4M30 30v4M34 30v4M38 30v4M42 30v4',
  fan: 'M6 6h36v36H6zM24 39a15 15 0 1 0 0-30 15 15 0 0 0 0 30zM24 27a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM24 21c-2-6 0-10 5-10M27 24c6-2 10 0 10 5M24 27c2 6 0 10-5 10M21 24c-6 2-10 0-10-5M10 10h.01M38 10h.01M10 38h.01M38 38h.01',
  cooler: 'M16 6h22v30H16zM16 11h22M16 16h22M16 21h22M16 26h22M16 31h22M21 36v6M27 36v6M33 36v6M14 42h26M6 12h10v18H6zM11 17v8',
  monitor: 'M4 7h40v27H4zM8 11h32v19H8zM24 34v6M15 42h18',
  mobo: 'M8 5h32v38H8zM13 10h11v11H13zM29 9h3v17h-3zM35 9h3v17h-3zM13 27h22v3H13zM13 34h22v3H13zM8 13H4M8 19H4',
  psu: 'M3 12h30v24H3zM18 31a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM11 24h14M18 17v14M33 18h4c4 0 4 6 8 6M33 26h4c4 0 4 6 8 6',
  ssd: 'M3 18h38v12H3zM41 20h4v8h-4M8 21h8v6H8zM19 21h8v6h-8zM31 22h6v4h-6z',
  tower: 'M12 4h24v40H12zM16 8h16v5H16zM24 19a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM24 34a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
};

const rand = (a, b) => a + Math.random() * (b - a);

function useMotes(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = prefersReducedMotion();
    const mq = window.matchMedia(MOBILE);
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    let last = performance.now();
    let beams = [];
    let motes = [];
    let dust = [];
    let glints = [];

    const newMote = (b, anywhere) => ({
      b,
      x: b.x + rand(-3, 3),
      y: anywhere ? rand(b.top, b.floor) : b.floor + rand(-4, 4),
      vy: rand(-1.3, -0.35),
      r: rand(0.5, 1.7),
      ph: rand(0, 6.3),
    });
    const newDust = () => ({
      x: w / 2 + rand(-0.22, 0.22) * w,
      y: rand(0.2, FLOOR) * h,
      vx: rand(-0.12, 0.12),
      vy: rand(-0.18, -0.03),
      r: rand(0.4, 1.4),
      ph: rand(0, 6.3),
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const phone = mq.matches;
      beams = NODES.filter((n) => n.beam).map((n) => ({
        x: ((phone ? n.mx ?? n.x : n.x) / 100) * w,
        top: ((phone ? n.my ?? n.y : n.y) / 100) * h + 40,
        floor: FLOOR * h,
      }));
      motes = beams.flatMap((b) => Array.from({ length: phone ? 14 : 22 }, () => newMote(b, true)));
      dust = Array.from({ length: phone ? 35 : 70 }, newDust);
      glints = Array.from({ length: phone ? 30 : 60 }, () => ({
        x: rand(0, w), y: rand(FLOOR - 0.01, 1) * h, r: rand(0.3, 1), ph: rand(0, 6.3), sp: rand(0.5, 2),
      }));
      if (reduced) draw(0, 16.67);
    };

    const dot = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };

    function draw(t, dt) {
      const k = dt / 16.67;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      ctx.fillStyle = '#d9ccf2';
      for (const g of glints) {
        ctx.globalAlpha = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(t / 1000 * g.sp + g.ph));
        dot(g.x, g.y, g.r);
      }

      ctx.fillStyle = '#c995ff';
      for (const d of dust) {
        d.x += (d.vx + Math.sin(t / 2000 + d.ph) * 0.08) * k;
        d.y += d.vy * k;
        if (d.y < 0.15 * h) Object.assign(d, newDust(), { y: FLOOR * h });
        ctx.globalAlpha = 0.25 + 0.4 * (0.5 + 0.5 * Math.sin(t / 900 + d.ph));
        dot(d.x, d.y, d.r);
      }

      ctx.fillStyle = '#f3dfa6';
      for (const m of motes) {
        m.y += m.vy * k;
        m.x += Math.sin(t / 700 + m.ph) * 0.05 * k;
        if (m.y < m.b.top) Object.assign(m, newMote(m.b, false));
        const span = m.b.floor - m.b.top;
        const p = (m.b.floor - m.y) / span; // 0 at floor → 1 at node
        ctx.globalAlpha = Math.max(0, Math.min(1, (1 - p) * 1.4)) * (0.6 + 0.4 * Math.sin(t / 200 + m.ph));
        dot(m.x, m.y, m.r);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    const loop = (now) => {
      const dt = Math.min(now - last, 50);
      last = now;
      draw(now, dt);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (reduced || raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); else stop(); });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    resize();
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [canvasRef]);
}

export default function HeroScene() {
  const canvasRef = useRef(null);
  useMotes(canvasRef);
  const [pressed, press] = usePress();

  // Press the key → glide through the pinned hero so the photo opens out of the sparkle.
  const onPress = () => {
    press();
    const hero = document.querySelector('.hero');
    const pin = ScrollTrigger.getAll().find((st) => st.trigger === hero && st.pin);
    const target = pin ? pin.end : (hero?.offsetTop ?? 0) + (hero?.offsetHeight ?? window.innerHeight);
    setTimeout(() => {
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(target, { duration: 2.2 });
      else window.scrollTo({ top: target, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }, 220); // let the keypress land first
  };

  return (
    <div className="hero__scene">
      <div className="scene__mist" aria-hidden="true" />
      <canvas ref={canvasRef} className="scene__canvas" aria-hidden="true" />
      <div className={`scene__portal ${pressed ? 'is-pressed' : ''}`}>
        <span className="scene__halo" aria-hidden="true" />
        <button type="button" className="scene__key" onClick={onPress} aria-label="Press to reveal" data-cursor="none">
          <svg className="scene__emblem" viewBox="0 0 972 710" aria-hidden="true" focusable="false">
            {/* switch housing: a faint floor outline the cap presses down onto */}
            <path className="scene__base" d="M32 432 L486 694 L940 432" />
            <g className="scene__cap">
              <path d="M177 210 L486 385 L486 678 L32 415 Z" />
              <path d="M486 385 L795 210 L940 415 L486 678 Z" />
              <path d="M486 32 L795 210 L486 385 L177 210 Z" />
              <path d="M486 85 L712 212 L486 340 L262 212 Z" strokeWidth="11" />
              <path className="scene__spark" d="M486 132 Q496 200 564 212 Q496 224 486 292 Q476 224 408 212 Q476 200 486 132 Z" />
            </g>
          </svg>
        </button>
        <span className="scene__flare" aria-hidden="true" />
      </div>
      {NODES.map((n) => {
        const vars = {
          '--x': `${n.x}%`, '--y': `${n.y}%`,
          '--mx': `${n.mx ?? n.x}%`, '--my': `${n.my ?? n.y}%`,
        };
        return (
          <div key={n.name} className={`scene__group scene__group--${n.size}`} style={vars} aria-hidden="true">
            <span className="scene__thread" />
            {n.beam && <span className="scene__beam" />}
            <div className="scene__node">
              <svg className="node__glyph" viewBox="0 0 48 48"><path d={ICONS[n.icon]} /></svg>
              <span className="node__label">{n.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
