import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../../lib/api.js';
import { money, date, STATUSES } from '../../lib/format.js';
import StatusBadge from '../../components/StatusBadge.jsx';

function RevenueChart({ series }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...series.map((d) => d.revenue));
  const W = 700;
  const H = 220;
  const bw = W / series.length;

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H + 24}`} role="img" aria-label="Revenue over the last 14 days">
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line key={t} x1="0" x2={W} y1={H - H * t} y2={H - H * t} className="chart__grid" />
        ))}
        {series.map((d, i) => {
          const h = Math.max(2, (d.revenue / max) * (H - 10));
          return (
            <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={i * bw} y="0" width={bw} height={H} fill="transparent" />
              <rect
                x={i * bw + bw * 0.2}
                y={H - h}
                width={bw * 0.6}
                height={h}
                rx="4"
                className={`chart__bar ${hover === i ? 'is-hover' : ''}`}
              />
              {i % 2 === 0 && (
                <text x={i * bw + bw / 2} y={H + 18} textAnchor="middle" className="chart__label">
                  {new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="chart__tip">
        {hover !== null ? (
          <>
            <b>{money(series[hover].revenue)}</b> · {series[hover].orders} order(s) ·{' '}
            {new Date(series[hover].date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </>
        ) : (
          <>Hover a bar for details · {money(series.reduce((s, d) => s + d.revenue, 0))} in 14 days</>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data)).catch((e) => setError(errMsg(e)));
  }, []);

  if (error) return <p className="form-error">{error}</p>;
  if (!stats) return <p>Loading dashboard…</p>;

  const totalByStatus = Object.values(stats.byStatus).reduce((a, b) => a + b, 0) || 1;
  const kpis = [
    { label: 'Revenue', value: money(stats.revenue), hint: 'excl. cancelled' },
    { label: 'Orders', value: stats.orders, hint: `${stats.byStatus.pending || 0} awaiting action` },
    { label: 'Products', value: stats.products, hint: `${stats.categories} categories` },
    { label: 'Customers', value: stats.customers, hint: 'registered' },
  ];

  return (
    <div className="dash">
      <div className="kpis">
        {kpis.map((k) => (
          <div className="kpi" key={k.label}>
            <span>{k.label}</span>
            <b>{k.value}</b>
            <small>{k.hint}</small>
          </div>
        ))}
      </div>

      <div className="dash__row">
        <section className="panel panel--grow">
          <div className="panel__head"><h3>Revenue — last 14 days</h3></div>
          <RevenueChart series={stats.series} />
        </section>
        <section className="panel">
          <div className="panel__head"><h3>Orders by status</h3></div>
          <div className="status-bars">
            {STATUSES.map((s) => {
              const n = stats.byStatus[s] || 0;
              return (
                <Link to={`/admin/orders?status=${s}`} key={s} className="status-bar">
                  <div className="status-bar__top"><StatusBadge status={s} /><b>{n}</b></div>
                  <div className="status-bar__track"><span className={`bg--${s}`} style={{ width: `${(n / totalByStatus) * 100}%` }} /></div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <div className="dash__row">
        <section className="panel panel--grow">
          <div className="panel__head">
            <h3>Recent orders</h3>
            <Link to="/admin/orders">View all →</Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th className="num">Total</th></tr></thead>
              <tbody>
                {stats.recentOrders.map((o) => (
                  <tr key={o._id}>
                    <td><Link to={`/admin/orders?open=${o._id}`}>{o.orderNumber}</Link></td>
                    <td>{o.shippingAddress.fullName}</td>
                    <td>{date(o.createdAt)}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="num">{money(o.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="dash__col">
          <section className="panel">
            <div className="panel__head"><h3>Top sellers</h3></div>
            <ol className="mini-list">
              {stats.topProducts.map((p) => (
                <li key={p._id}><span>{p.name}</span><b>{p.sold} sold</b></li>
              ))}
            </ol>
          </section>
          <section className="panel">
            <div className="panel__head">
              <h3>Low stock</h3>
              <Link to="/admin/products">Manage →</Link>
            </div>
            {stats.lowStock.length === 0 ? (
              <p className="muted">All products well stocked.</p>
            ) : (
              <ul className="mini-list">
                {stats.lowStock.map((p) => (
                  <li key={p._id}><span>{p.name}</span><b className={p.stock === 0 ? 'text-danger' : 'text-warn'}>{p.stock} left</b></li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
