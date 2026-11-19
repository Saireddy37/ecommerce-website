import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api, formatPrice } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Orders() {
  const { token } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const placed = location.state?.placed;

  useEffect(() => {
    api('/orders/my', { token })
      .then(setOrders)
      .catch((e) => setError(e.message));
  }, [token]);

  return (
    <>
      <h1>My orders</h1>
      {placed && <p className="notice success">Order #{placed} placed. Thank you!</p>}
      {error && <p className="notice error">{error}</p>}
      {!orders && !error && <p className="notice">Loading...</p>}

      {orders && orders.length === 0 && (
        <div className="empty">
          <p className="muted">You haven't placed any orders yet.</p>
          <Link to="/" className="btn btn-primary">
            Start shopping
          </Link>
        </div>
      )}

      {orders &&
        orders.map((o) => (
          <section className="order" key={o.id}>
            <header>
              <div>
                <strong>Order #{o.id}</strong>
                <span className="muted">
                  {' '}
                  · {new Date(o.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </span>
              </div>
              <span className={`status status-${o.status}`}>{o.status}</span>
            </header>
            <ul>
              {o.items.map((it, idx) => (
                <li key={idx}>
                  <span>
                    {it.name} × {it.quantity}
                  </span>
                  <span>{formatPrice(Number(it.price) * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <footer>
              <span>Total</span>
              <strong>{formatPrice(o.total)}</strong>
            </footer>
          </section>
        ))}
    </>
  );
}
