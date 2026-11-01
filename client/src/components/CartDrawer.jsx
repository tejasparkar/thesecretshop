import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { getLenis } from '../hooks/useSmoothScroll.js';
import { money } from '../lib/format.js';
import Img from './Img.jsx';

export default function CartDrawer() {
  const { items, open, setOpen, update, remove, totals } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const lenis = getLenis();
    if (open) lenis?.stop();
    else lenis?.start();
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  return (
    <div className={`drawer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <div className="drawer__scrim" onClick={() => setOpen(false)} />
      <aside className="drawer__panel" data-lenis-prevent>
        <div className="drawer__head">
          <h3>Your cart <sup>{totals.count}</sup></h3>
          <button onClick={() => setOpen(false)} aria-label="Close cart">Close</button>
        </div>

        {items.length === 0 ? (
          <div className="drawer__empty">
            <p>Nothing here yet.</p>
            <Link to="/shop" className="pill" onClick={() => setOpen(false)}>Browse hardware</Link>
          </div>
        ) : (
          <>
            <ul className="drawer__items">
              {items.map((i) => (
                <li key={i._id}>
                  <Link to={`/product/${i.slug}`} onClick={() => setOpen(false)}>
                    <Img src={i.image} alt={i.name} />
                  </Link>
                  <div>
                    <Link to={`/product/${i.slug}`} onClick={() => setOpen(false)} className="drawer__name">{i.name}</Link>
                    <span>{money(i.price)}</span>
                    <div className="qty">
                      <button onClick={() => update(i._id, i.quantity - 1)} aria-label="Decrease">−</button>
                      <span>{i.quantity}</span>
                      <button onClick={() => update(i._id, i.quantity + 1)} aria-label="Increase" disabled={i.quantity >= i.stock}>+</button>
                    </div>
                  </div>
                  <button className="drawer__remove" onClick={() => remove(i._id)}>Remove</button>
                </li>
              ))}
            </ul>
            <div className="drawer__foot">
              <div className="row"><span>Subtotal</span><span>{money(totals.subtotal)}</span></div>
              <div className="row muted"><span>GST (18%)</span><span>{money(totals.tax)}</span></div>
              <div className="row muted"><span>Shipping</span><span>{totals.shipping ? money(totals.shipping) : 'Free'}</span></div>
              <div className="row total"><span>Total</span><span>{money(totals.total)}</span></div>
              <button
                className="btn btn--block"
                onClick={() => {
                  setOpen(false);
                  navigate('/checkout');
                }}
              >
                Checkout →
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
