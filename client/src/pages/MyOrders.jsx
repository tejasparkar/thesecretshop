import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import { date, money } from '../lib/format.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function MyOrders() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api.get('/orders/mine').then(({ data }) => setOrders(data)).catch(() => setOrders([]));
  }, []);

  return (
    <div className="wrap account">
      <header className="page-hero page-hero--sm">
        <p className="eyebrow">( Your account )</p>
        <h1>Orders</h1>
      </header>

      {orders === null ? (
        <p>Loading…</p>
      ) : orders.length === 0 ? (
        <div className="empty">
          <p>You haven't placed any orders yet.</p>
          <Link to="/shop" className="pill">Start shopping</Link>
        </div>
      ) : (
        <div className="order-list">
          {orders.map((o) => (
            <Link to={`/account/orders/${o._id}`} className="order-row" key={o._id}>
              <div>
                <b>{o.orderNumber}</b>
                <small>{date(o.createdAt)} · {o.items.reduce((s, i) => s + i.quantity, 0)} item(s)</small>
              </div>
              <StatusBadge status={o.status} />
              <b>{money(o.grandTotal)}</b>
              <span className="order-row__arrow">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
