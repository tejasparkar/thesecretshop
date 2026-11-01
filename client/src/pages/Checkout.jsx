import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../lib/api.js';
import { money } from '../lib/format.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Img from '../components/Img.jsx';

const FIELDS = [
  ['fullName', 'Full name', 'half'],
  ['phone', 'Phone', 'half'],
  ['line1', 'Address line 1', 'full'],
  ['line2', 'Address line 2 (optional)', 'full'],
  ['city', 'City', 'third'],
  ['state', 'State', 'third'],
  ['postalCode', 'PIN code', 'third'],
];

export default function Checkout() {
  const { items, totals, clear } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [address, setAddress] = useState({ fullName: user?.name || '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India' });
  const [payment, setPayment] = useState('cod');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (items.length === 0) {
    return (
      <div className="wrap page-msg">
        <h2>Your cart is empty.</h2>
        <Link to="/shop" className="pill">Browse hardware</Link>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/orders', {
        items: items.map((i) => ({ product: i._id, quantity: i.quantity })),
        shippingAddress: address,
        paymentMethod: payment,
      });
      clear();
      toast('Order placed — thank you!');
      navigate(`/account/orders/${data._id}`, { state: { justPlaced: true } });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap checkout">
      <header className="page-hero page-hero--sm">
        <p className="eyebrow">( Checkout )</p>
        <h1>Almost yours.</h1>
      </header>

      <form className="checkout__grid" onSubmit={submit}>
        <div className="card">
          <h3>Shipping address</h3>
          <div className="form-grid">
            {FIELDS.map(([key, label, size]) => (
              <label key={key} className={`field field--${size}`}>
                <span>{label}</span>
                <input
                  className="input"
                  required={key !== 'line2'}
                  value={address[key]}
                  pattern={key === 'postalCode' ? '\\d{6}' : key === 'phone' ? '[0-9+ ]{10,14}' : undefined}
                  onChange={(e) => setAddress({ ...address, [key]: e.target.value })}
                />
              </label>
            ))}
          </div>

          <h3>Payment</h3>
          <div className="pay-options">
            {[
              ['cod', 'Cash on delivery', 'Pay when your order arrives'],
              ['upi', 'UPI', 'Payment link sent after confirmation'],
              ['card', 'Card', 'Payment link sent after confirmation'],
            ].map(([val, title, sub]) => (
              <label key={val} className={`pay-option ${payment === val ? 'is-active' : ''}`}>
                <input type="radio" name="pay" value={val} checked={payment === val} onChange={() => setPayment(val)} />
                <b>{title}</b>
                <small>{sub}</small>
              </label>
            ))}
          </div>
        </div>

        <aside className="card summary">
          <h3>Order summary</h3>
          <ul className="summary__items">
            {items.map((i) => (
              <li key={i._id}>
                <Img src={i.image} alt={i.name} />
                <span>{i.name} <small>× {i.quantity}</small></span>
                <b>{money(i.price * i.quantity)}</b>
              </li>
            ))}
          </ul>
          <div className="row"><span>Subtotal</span><span>{money(totals.subtotal)}</span></div>
          <div className="row muted"><span>GST (18%)</span><span>{money(totals.tax)}</span></div>
          <div className="row muted"><span>Shipping</span><span>{totals.shipping ? money(totals.shipping) : 'Free'}</span></div>
          <div className="row total"><span>Total</span><span>{money(totals.total)}</span></div>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn--block" disabled={busy}>{busy ? 'Placing order…' : `Place order — ${money(totals.total)}`}</button>
        </aside>
      </form>
    </div>
  );
}
