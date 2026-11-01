import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../lib/api.js';
import { money } from '../lib/format.js';
import { gsap, prefersReducedMotion } from '../lib/gsap.js';
import useReveal from '../hooks/useReveal.js';
import { useCart } from '../context/CartContext.jsx';
import Img from '../components/Img.jsx';
import Magnetic from '../components/Magnetic.jsx';
import ProductCard from '../components/ProductCard.jsx';

export default function ProductPage() {
  const { slug } = useParams();
  const { add } = useCart();
  const [state, setState] = useState({ product: null, related: [], error: '' });
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const root = useRef(null);

  useEffect(() => {
    setState({ product: null, related: [], error: '' });
    setQty(1);
    setActive(0);
    api
      .get(`/products/${slug}`)
      .then(({ data }) => setState({ ...data, error: '' }))
      .catch((err) => setState({ product: null, related: [], error: errMsg(err) }));
  }, [slug]);

  const { product, related, error } = state;

  // Intro + sticky gallery image zooms subtly as the info column scrolls.
  useLayoutEffect(() => {
    if (!product || prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.from('.pdp__info > *', { y: 40, opacity: 0, stagger: 0.07, duration: 0.9, ease: 'power3.out' });
      gsap.from('.pdp__main', { clipPath: 'inset(100% 0 0 0)', duration: 1.2, ease: 'power4.out' });
      gsap.to('.pdp__main img', {
        scale: 1.12,
        ease: 'none',
        scrollTrigger: { trigger: '.pdp', start: 'top top', end: 'bottom top', scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, [product]);

  useReveal(root, [related]);

  if (error) return <div className="wrap page-msg"><h2>{error}</h2><Link to="/shop" className="pill">Back to shop</Link></div>;
  if (!product) return <div className="page-loading">Loading…</div>;

  const off = product.comparePrice > product.price ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;

  return (
    <div ref={root}>
      <section className="pdp wrap">
        <div className="pdp__gallery">
          <div className="pdp__main">
            <Img src={product.images[active]} alt={product.name} />
          </div>
          {product.images.length > 1 && (
            <div className="pdp__thumbs">
              {product.images.map((src, i) => (
                <button key={src} className={i === active ? 'is-active' : ''} onClick={() => setActive(i)}>
                  <Img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pdp__info">
          <nav className="crumbs">
            <Link to="/shop">Shop</Link> / <Link to={`/shop/${product.category.slug}`}>{product.category.name}</Link>
          </nav>
          <p className="pcard__brand">{product.brand}</p>
          <h1 className="pdp__title">{product.name}</h1>
          <div className="pdp__price">
            <span>{money(product.price)}</span>
            {off > 0 && <><s>{money(product.comparePrice)}</s><em className="badge">−{off}%</em></>}
          </div>
          <p className="pdp__desc">{product.description}</p>

          <p className={`stock ${product.stock === 0 ? 'stock--out' : product.stock <= 5 ? 'stock--low' : ''}`}>
            {product.stock === 0 ? 'Out of stock' : product.stock <= 5 ? `Only ${product.stock} left` : 'In stock — ships in 48h'}
          </p>

          {product.stock > 0 && (
            <div className="pdp__buy">
              <div className="qty qty--lg">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))}>+</button>
              </div>
              <Magnetic strength={0.2}>
                <button className="btn" onClick={() => add(product, qty)}>Add to cart — {money(product.price * qty)}</button>
              </Magnetic>
            </div>
          )}

          {product.specs?.length > 0 && (
            <div className="specs">
              <p className="eyebrow">Specifications</p>
              <dl>
                {product.specs.map((s, i) => (
                  <div key={i}><dt>{s.label}</dt><dd>{s.value}</dd></div>
                ))}
              </dl>
            </div>
          )}

          <ul className="perks">
            <li>✦ 2-year warranty</li>
            <li>✦ Free shipping over ₹50,000</li>
            <li>✦ 7-day returns</li>
          </ul>
        </div>
      </section>

      {related.length > 0 && (
        <section className="wrap related">
          <div className="section-head"><h2 data-reveal>You might also like</h2></div>
          <div className="grid-4">{related.map((p) => <ProductCard product={p} key={p._id} />)}</div>
        </section>
      )}
    </div>
  );
}
