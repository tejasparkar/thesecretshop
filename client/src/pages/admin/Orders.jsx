import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../../lib/api.js';
import { date, money, STATUSES, STATUS_FLOW } from '../../lib/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import OrderView from '../../components/OrderView.jsx';
import Modal from '../../components/Modal.jsx';

function OrderPanel({ id, onClose, onUpdated }) {
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [note, setNote] = useState('');
  const [tracking, setTracking] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/orders/${id}`).then(({ data }) => {
      setOrder(data);
      setTracking(data.trackingNumber || '');
      setAdminNote(data.adminNote || '');
    });
  }, [id]);

  const save = async (patch, msg) => {
    setBusy(true);
    try {
      const { data } = await api.put(`/orders/${id}/status`, patch);
      setOrder(data);
      setNote('');
      onUpdated(data);
      toast(msg);
    } catch (e) {
      toast(errMsg(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={order ? `Order ${order.orderNumber}` : 'Order'} onClose={onClose} wide>
      {!order ? (
        <p>Loading…</p>
      ) : (
        <div className="order-admin">
          <OrderView order={order} />
          <aside className="order-admin__actions">
            <p className="eyebrow">Customer</p>
            <p>{order.user?.name}<br /><small className="muted">{order.user?.email}</small></p>

            <p className="eyebrow">Update status</p>
            {STATUS_FLOW[order.status].length === 0 ? (
              <p className="muted">This order is {order.status} — no further changes.</p>
            ) : (
              <>
                <input className="input" placeholder="Note for history (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="btn-row">
                  {STATUS_FLOW[order.status].map((s) => (
                    <button
                      key={s}
                      disabled={busy}
                      className={`pill ${s === 'cancelled' ? 'pill--danger' : ''}`}
                      onClick={() => save({ status: s, note: note || undefined }, `Marked ${s}`)}
                    >
                      Mark {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            <p className="eyebrow">Tracking number</p>
            <div className="inline-form">
              <input className="input" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="e.g. BLUEDART 123456" />
              <button className="pill" disabled={busy} onClick={() => save({ trackingNumber: tracking }, 'Tracking saved')}>Save</button>
            </div>

            <p className="eyebrow">Payment</p>
            <button className="pill pill--ghost" disabled={busy} onClick={() => save({ isPaid: !order.isPaid }, order.isPaid ? 'Marked unpaid' : 'Marked paid')}>
              {order.isPaid ? 'Mark as unpaid' : 'Mark as paid'}
            </button>

            <p className="eyebrow">Internal note</p>
            <textarea className="input" rows={3} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
            <button className="pill pill--ghost" disabled={busy} onClick={() => save({ adminNote }, 'Note saved')}>Save note</button>
          </aside>
        </div>
      )}
    </Modal>
  );
}

export default function AdminOrders() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const openId = params.get('open');
  const page = parseInt(params.get('page') || '1', 10);
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [data, setData] = useState({ orders: [], total: 0, pages: 0 });
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/orders', { params: { status: status || undefined, q: query || undefined, page, limit: 15 } })
      .then(({ data: d }) => setData(d))
      .finally(() => setLoading(false));
    api.get('/admin/stats').then(({ data: s }) => setCounts(s.byStatus)).catch(() => {});
  }, [status, query, page]);

  useEffect(load, [load]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page' && k !== 'open') next.delete('page');
    setParams(next);
  };

  const all = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="toolbar">
        <div className="tabs">
          <button className={!status ? 'is-active' : ''} onClick={() => setParam('status', '')}>All <small>{all}</small></button>
          {STATUSES.map((s) => (
            <button key={s} className={status === s ? 'is-active' : ''} onClick={() => setParam('status', s)}>
              {s} <small>{counts[s] || 0}</small>
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setQuery(q.trim()); setParam('page', ''); }}>
          <input className="input" placeholder="Search order #, name, phone" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="table table--click">
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th>Payment</th><th>Status</th><th className="num">Total</th></tr>
            </thead>
            <tbody>
              {data.orders.map((o) => (
                <tr key={o._id} onClick={() => setParam('open', o._id)}>
                  <td><b>{o.orderNumber}</b></td>
                  <td>{o.shippingAddress.fullName}<br /><small className="muted">{o.user?.email}</small></td>
                  <td>{date(o.createdAt)}</td>
                  <td>{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td>{o.paymentMethod.toUpperCase()} <small className={o.isPaid ? 'text-ok' : 'muted'}>{o.isPaid ? '· paid' : '· unpaid'}</small></td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="num">{money(o.grandTotal)}</td>
                </tr>
              ))}
              {!loading && data.orders.length === 0 && (
                <tr><td colSpan={7} className="muted center">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {data.pages > 1 && (
          <div className="pager">
            {Array.from({ length: data.pages }, (_, i) => (
              <button key={i} className={page === i + 1 ? 'is-active' : ''} onClick={() => setParam('page', String(i + 1))}>{i + 1}</button>
            ))}
          </div>
        )}
      </div>

      {openId && <OrderPanel id={openId} onClose={() => setParam('open', '')} onUpdated={load} />}
    </div>
  );
}
