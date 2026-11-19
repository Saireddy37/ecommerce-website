import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, formatPrice } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Checkout() {
  const { token, user } = useAuth();
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (items.length === 0) {
    return (
      <div className="empty">
        <h1>Nothing to check out</h1>
        <Link to="/" className="btn btn-primary">
          Back to shop
        </Link>
      </div>
    );
  }

  async function placeOrder() {
    setError('');
    setBusy(true);
    try {
      const order = await api('/orders', {
        method: 'POST',
        token,
        body: {
          items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
        },
      });
      clearCart();
      navigate('/orders', { state: { placed: order.id } });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Checkout</h1>
      <div className="cart-layout">
        <div className="cart-list">
          <h2>Review items</h2>
          {items.map(({ product, quantity }) => (
            <div className="cart-row compact" key={product.id}>
              <img src={product.image_url} alt={product.name} />
              <div className="cart-info">
                <span>{product.name}</span>
                <span className="muted">Qty {quantity}</span>
              </div>
              <strong>{formatPrice(Number(product.price) * quantity)}</strong>
            </div>
          ))}
          <p className="muted">
            Placing order as {user.name} ({user.email}).
          </p>
        </div>

        <aside className="summary">
          <h2>Payment</h2>
          <p className="muted small">
            Online payment (Razorpay) will be added in the next step. For now, placing the order
            saves it to your account.
          </p>
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          {error && <p className="notice error">{error}</p>}
          <button className="btn btn-primary btn-block" onClick={placeOrder} disabled={busy}>
            {busy ? 'Placing order...' : 'Place order'}
          </button>
        </aside>
      </div>
    </>
  );
}
