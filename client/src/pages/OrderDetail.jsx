import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import api, { errMsg } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import OrderView from '../components/OrderView.jsx';

export default function OrderDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data)).catch((e) => setError(errMsg(e)));
  }, [id]);

  const cancel = async () => {
    try {
      const { data } = await api.put(`/orders/${id}/cancel`);
      setOrder(data);
      toast('Order cancelled');
    } catch (e) {
      toast(errMsg(e), 'error');
    }
  };

  if (error) return <div className="wrap page-msg"><h2>{error}</h2></div>;
  if (!order) return <div className="page-loading">Loading…</div>;

  return (
    <div className="wrap account">
      <header className="page-hero page-hero--sm">
        <p className="eyebrow">( {state?.justPlaced ? 'Order confirmed' : 'Order details'} )</p>
        <h1>{state?.justPlaced ? 'Thank you!' : 'Your order'}</h1>
      </header>
      <div className="card">
        <OrderView order={order} />
        <div className="order-actions">
          <Link to="/account/orders" className="pill pill--ghost">← All orders</Link>
          {order.status === 'pending' && <button className="pill pill--danger" onClick={cancel}>Cancel order</button>}
        </div>
      </div>
    </div>
  );
}
