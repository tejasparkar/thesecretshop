import { dateTime, money, STATUSES } from '../lib/format.js';
import StatusBadge from './StatusBadge.jsx';
import Img from './Img.jsx';

/** Order details shared by the customer order page and the admin order panel. */
export default function OrderView({ order }) {
  const a = order.shippingAddress;
  const reached = new Set(order.statusHistory.map((h) => h.status));
  const flow = STATUSES.filter((s) => s !== 'cancelled');

  return (
    <div className="order-view">
      <div className="order-view__head">
        <div>
          <h2>{order.orderNumber}</h2>
          <small>Placed {dateTime(order.createdAt)}</small>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {order.status !== 'cancelled' && (
        <ol className="tracker">
          {flow.map((s) => (
            <li key={s} className={reached.has(s) || flow.indexOf(s) <= flow.indexOf(order.status) ? 'is-done' : ''}>
              <span />{s}
            </li>
          ))}
        </ol>
      )}

      <ul className="order-view__items">
        {order.items.map((i) => (
          <li key={i.product}>
            <Img src={i.image} alt={i.name} />
            <span>{i.name}<small>{money(i.price)} × {i.quantity}</small></span>
            <b>{money(i.price * i.quantity)}</b>
          </li>
        ))}
      </ul>

      <div className="order-view__grid">
        <div>
          <p className="eyebrow">Ship to</p>
          <p>
            {a.fullName}<br />{a.line1}{a.line2 && <>, {a.line2}</>}<br />
            {a.city}, {a.state} {a.postalCode}<br />{a.country}<br />📞 {a.phone}
          </p>
          {order.trackingNumber && <p><span className="eyebrow">Tracking</span><br />{order.trackingNumber}</p>}
        </div>
        <div>
          <p className="eyebrow">Payment</p>
          <p>{order.paymentMethod.toUpperCase()} · {order.isPaid ? 'Paid' : 'Unpaid'}</p>
          <div className="row"><span>Items</span><span>{money(order.itemsTotal)}</span></div>
          <div className="row muted"><span>GST</span><span>{money(order.tax)}</span></div>
          <div className="row muted"><span>Shipping</span><span>{order.shippingFee ? money(order.shippingFee) : 'Free'}</span></div>
          <div className="row total"><span>Total</span><span>{money(order.grandTotal)}</span></div>
        </div>
      </div>

      <div>
        <p className="eyebrow">History</p>
        <ul className="history">
          {[...order.statusHistory].reverse().map((h, i) => (
            <li key={i}><StatusBadge status={h.status} /> <span>{h.note}</span> <small>{dateTime(h.at)}</small></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
