import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import api from '../lib/api.js';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap.js';
import useReveal from '../hooks/useReveal.js';
import Lines, { Chars } from '../components/Lines.jsx';
import Magnetic from '../components/Magnetic.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Img from '../components/Img.jsx';

const HERO_IMG = 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=2000&q=80';
const ANATOMY_IMG = 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=1400&q=80';

const MANIFESTO =
  'We don\'t sell boxes of parts. We hand-pick every component, bench-test every build and ship machines that feel like they were made just for you — because they were.';

const ANATOMY = [
  { k: 'CPU', title: 'The brain', text: 'Latest-gen Ryzen & Core Ultra silicon, binned and stress-tested for 24 hours before it leaves the bench.' },
  { k: 'GPU', title: 'The muscle', text: 'RTX 50-series and Radeon RX 9000 cards with custom fan curves for silent, sustained boost clocks.' },
  { k: 'RAM', title: 'The reflexes', text: 'Tuned DDR5 kits with EXPO/XMP profiles dialled in, so you get every MHz you paid for.' },
  { k: 'AIR', title: 'The lungs', text: 'Positive-pressure airflow, premium coolers and cable management you\'ll want to show off.' },
];

const STATS = [
  { n: 15000, suffix: '+', label: 'Builds shipped' },
  { n: 48, suffix: 'h', label: 'Average dispatch' },
  { n: 2, suffix: ' yr', label: 'Warranty on every rig' },
  { n: 4.9, suffix: '★', label: 'Average rating', decimals: 1 },
];

const BRANDS = ['NVIDIA', 'AMD', 'Intel', 'ASUS ROG', 'Corsair', 'Samsung', 'Razer', 'SteelSeries', 'LG', 'Noctua', 'MSI', 'Lian Li'];

export default function Home() {
  const { categories, introDone } = useOutletContext();
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const root = useRef(null);

  useEffect(() => {
    api.get('/products', { params: { featured: 1, limit: 6 } }).then(({ data }) => setFeatured(data.products)).catch(() => {});
    api.get('/products', { params: { limit: 4, sort: 'newest' } }).then(({ data }) => setLatest(data.products)).catch(() => {});
  }, []);

  // Hero intro — letters rise once the preloader has finished.
  useLayoutEffect(() => {
    if (!introDone || prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ delay: 0.1 })
        .from('.hero__title .char', { yPercent: 120, rotate: 6, duration: 1.2, ease: 'power4.out', stagger: 0.035 })
        .from('.hero__meta > *', { y: 20, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' }, '-=0.8')
        .from('.hero__media', { opacity: 0, duration: 1 }, '-=0.9');
    }, root);
    return () => ctx.revert();
  }, [introDone]);

  // Scroll choreography. Rebuilt when data that changes layout (categories / products) arrives.
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      // 1. Hero: pin + expand media from a card to full-bleed, title drifts up.
      gsap
        .timeline({
          scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=120%', scrub: 1, pin: true },
        })
        .fromTo(
          '.hero__media',
          { clipPath: 'inset(42% 30% 6% 30% round 28px)' },
          { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none' }
        )
        .fromTo('.hero__media img', { scale: 1.35 }, { scale: 1, ease: 'none' }, 0)
        .to('.hero__title', { yPercent: -60, opacity: 0, ease: 'none' }, 0)
        .to('.hero__meta', { opacity: 0, ease: 'none' }, 0)
        .from('.hero__caption', { opacity: 0, y: 40, ease: 'none' }, 0.5);

      // 2. Velocity marquee: rows drift in opposite directions and surge with scroll speed.
      gsap.utils.toArray('.marquee__track').forEach((track, i) => {
        const loop = gsap.fromTo(
          track,
          { xPercent: i % 2 ? -50 : 0 },
          { xPercent: i % 2 ? 0 : -50, ease: 'none', duration: track.classList.contains('marquee__track--brands') ? 40 : 26, repeat: -1 }
        );
        ScrollTrigger.create({
          trigger: track,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => {
            const boost = gsap.utils.clamp(1, 7, 1 + Math.abs(self.getVelocity()) / 400);
            gsap.to(loop, {
              timeScale: boost,
              duration: 0.15,
              overwrite: true,
              onComplete: () => gsap.to(loop, { timeScale: 1, duration: 1.2, ease: 'power2.out', overwrite: true }),
            });
          },
        });
      });

      // 3. Manifesto: each word lights up as you scroll through it.
      gsap.fromTo(
        '.manifesto .word',
        { opacity: 0.12 },
        {
          opacity: 1,
          stagger: 0.1,
          ease: 'none',
          scrollTrigger: { trigger: '.manifesto', start: 'top 75%', end: 'bottom 45%', scrub: true },
        }
      );

      // 4. Horizontal category rail (pinned).
      const track = document.querySelector('.hscroll__track');
      if (track && categories.length) {
        const distance = () => track.scrollWidth - window.innerWidth;
        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: '.hscroll',
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
        gsap.to('.hscroll__progress span', {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: '.hscroll', start: 'top top', end: () => `+=${distance()}`, scrub: true },
        });
        gsap.utils.toArray('.ccard img').forEach((img) => {
          gsap.fromTo(img, { xPercent: -12 }, {
            xPercent: 12,
            ease: 'none',
            scrollTrigger: { trigger: img, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
          });
        });
      }

      // 5. Anatomy: pinned, steps crossfade while the rig rotates & zooms.
      const steps = gsap.utils.toArray('.anatomy__step');
      const atl = gsap.timeline({
        scrollTrigger: {
          trigger: '.anatomy',
          start: 'top top',
          end: `+=${steps.length * 90}%`,
          scrub: 1,
          pin: true,
          onUpdate: (self) => {
            const idx = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
            const counter = document.querySelector('.anatomy__count b');
            if (counter) counter.textContent = String(idx + 1).padStart(2, '0');
          },
        },
      });
      atl.fromTo('.anatomy__visual', { rotate: -8, scale: 0.85 }, { rotate: 6, scale: 1.08, ease: 'none', duration: steps.length }, 0);
      atl.fromTo('.anatomy__ring', { rotate: 0 }, { rotate: 270, ease: 'none', duration: steps.length }, 0);
      steps.forEach((step, i) => {
        if (i > 0) atl.fromTo(step, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.4 }, i - 0.2);
        if (i < steps.length - 1) atl.to(step, { opacity: 0, y: -60, duration: 0.4 }, i + 0.6);
        atl.fromTo(`.anatomy__dot:nth-child(${i + 1})`, { scale: 1 }, { scale: 1.8, backgroundColor: '#c6ff3d', duration: 0.3 }, i);
      });

      // 6. Featured grid: alternate columns drift at different speeds.
      gsap.utils.toArray('.featured__grid .pcard').forEach((card, i) => {
        gsap.fromTo(card, { y: i % 3 === 1 ? 120 : 40 }, {
          y: i % 3 === 1 ? -80 : -20,
          ease: 'none',
          scrollTrigger: { trigger: '.featured__grid', start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });

      // 7. Counters.
      gsap.utils.toArray('.stat__n').forEach((el) => {
        const target = parseFloat(el.dataset.n);
        const decimals = parseInt(el.dataset.decimals || '0', 10);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 2,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%' },
          onUpdate: () => {
            el.textContent = obj.v.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
          },
        });
      });

      // 8. Closing statement: text fills with colour as you scroll.
      gsap.fromTo(
        '.closer__text',
        { backgroundSize: '0% 100%' },
        { backgroundSize: '100% 100%', ease: 'none', scrollTrigger: { trigger: '.closer', start: 'top 70%', end: 'bottom 60%', scrub: true } }
      );
    }, root);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [categories.length, featured.length]);

  useReveal(root, [featured.length, latest.length]);

  return (
    <div ref={root} className="home">
      {/* ---------- HERO ---------- */}
      <section className="hero">
        <div className="hero__meta">
          <span className="eyebrow">( PC hardware, curated )</span>
          <span className="eyebrow">Est. 2026 — Bengaluru, IN</span>
        </div>
        <h1 className="hero__title">
          <span className="line"><Chars text="Built" /></span>
          <span className="line line--indent"><Chars text="different." /></span>
        </h1>
        <div className="hero__media">
          <img src={HERO_IMG} alt="A custom gaming PC glowing on a desk" />
          <div className="hero__caption">
            <p>Custom rigs, flagship GPUs and the peripherals to match.</p>
            <Magnetic>
              <Link to="/shop" className="round-btn round-btn--light" data-cursor="Shop">Explore<br />the shop</Link>
            </Magnetic>
          </div>
        </div>
        <div className="hero__scroll">Scroll ↓</div>
      </section>

      {/* ---------- MARQUEE ---------- */}
      <section className="marquee" aria-hidden="true">
        {[0, 1].map((row) => (
          <div className="marquee__row" key={row}>
            <div className="marquee__track">
              {[...Array(2)].map((_, k) => (
                <span key={k}>
                  {(row === 0 ? ['Gaming PCs', 'Graphics Cards', 'Processors', 'Monitors'] : ['Peripherals', 'Memory', 'Storage', 'Custom Builds']).map((w) => (
                    <em key={w}>{w}<i>✦</i></em>
                  ))}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ---------- MANIFESTO ---------- */}
      <section className="manifesto wrap">
        <p className="eyebrow">( Who we are )</p>
        <p className="manifesto__text">
          {MANIFESTO.split(' ').map((w, i) => <span className="word" key={i}>{w} </span>)}
        </p>
      </section>

      {/* ---------- HORIZONTAL CATEGORIES ---------- */}
      <section className="hscroll">
        <div className="hscroll__head wrap">
          <Lines lines={['Shop by', 'category']} />
          <div className="hscroll__progress"><span /></div>
        </div>
        <div className="hscroll__track">
          {categories.map((c, i) => (
            <Link to={`/shop/${c.slug}`} className="ccard" key={c._id} data-cursor="Open">
              <div className="ccard__media"><Img src={c.image} alt={c.name} /></div>
              <div className="ccard__info">
                <span>{String(i + 1).padStart(2, '0')}</span>
                <h3>{c.name}</h3>
                <small>{c.productCount} products →</small>
              </div>
            </Link>
          ))}
          <Link to="/shop" className="ccard ccard--all" data-cursor="All">
            <h3>See everything →</h3>
          </Link>
        </div>
      </section>

      {/* ---------- ANATOMY (pinned storytelling) ---------- */}
      <section className="anatomy">
        <div className="anatomy__inner wrap">
          <div className="anatomy__left">
            <p className="eyebrow">( Anatomy of a build )</p>
            <div className="anatomy__count"><b>01</b> / {String(ANATOMY.length).padStart(2, '0')}</div>
            <div className="anatomy__steps">
              {ANATOMY.map((s) => (
                <div className="anatomy__step" key={s.k}>
                  <span className="anatomy__k">{s.k}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>
            <div className="anatomy__dots">{ANATOMY.map((s) => <span className="anatomy__dot" key={s.k} />)}</div>
          </div>
          <div className="anatomy__right">
            <div className="anatomy__ring" />
            <div className="anatomy__visual"><Img src={ANATOMY_IMG} alt="Inside a custom PC build" /></div>
          </div>
        </div>
      </section>

      {/* ---------- FEATURED ---------- */}
      <section className="featured wrap">
        <div className="section-head">
          <Lines lines={['Hand-picked', 'this month']} />
          <Link to="/shop" className="link-arrow">View all products →</Link>
        </div>
        <div className="featured__grid">
          {featured.map((p, i) => <ProductCard product={p} index={i} key={p._id} />)}
        </div>
      </section>

      {/* ---------- STATS ---------- */}
      <section className="stats wrap">
        {STATS.map((s) => (
          <div className="stat" key={s.label} data-reveal>
            <div className="stat__value">
              <span className="stat__n" data-n={s.n} data-decimals={s.decimals || 0}>0</span>
              <span>{s.suffix}</span>
            </div>
            <p>{s.label}</p>
          </div>
        ))}
      </section>

      {/* ---------- BRANDS ---------- */}
      <section className="brands" aria-label="Brands we stock">
        <div className="marquee__row">
          <div className="marquee__track marquee__track--brands">
            {[...BRANDS, ...BRANDS].map((b, i) => <span key={i}>{b}</span>)}
          </div>
        </div>
      </section>

      {/* ---------- NEW ARRIVALS ---------- */}
      <section className="latest wrap">
        <div className="section-head">
          <Lines lines={['Fresh off', 'the truck']} />
        </div>
        <div className="grid-4">
          {latest.map((p) => <ProductCard product={p} key={p._id} />)}
        </div>
      </section>

      {/* ---------- CLOSER ---------- */}
      <section className="closer wrap">
        <p className="closer__text">Your next build is a secret worth keeping.</p>
        <div className="closer__media" data-reveal>
          <div data-parallax="0.3"><Img src={HERO_IMG} alt="" /></div>
        </div>
      </section>
    </div>
  );
}
