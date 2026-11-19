import { Link, useNavigate } from 'react-router-dom';
import { formatPrice } from '../api.js';
import { useCart } from '../context/CartContext.jsx';

export default function Cart() {
  const { items, total, setQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="empty">
        <h1>Your cart is empty</h1>
        <p className="muted">Add something you like and it will show up here.</p>
        <Link to="/" className="btn btn-primary">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1>Your cart</h1>
      <div className="cart-layout">
        <div className="cart-list">
          {items.map(({ product, quantity }) => (
            <div className="cart-row" key={product.id}>
              <img src={product.image_url} alt={product.name} />
              <div className="cart-info">
                <Link to={`/product/${product.id}`}>{product.name}</Link>
                <span className="muted">{formatPrice(product.price)} each</span>
              </div>
              <div className="qty">
                <button onClick={() => setQuantity(product.id, quantity - 1)} aria-label="Less">
                  −
                </button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(product.id, quantity + 1)} aria-label="More">
                  +
                </button>
              </div>
              <strong className="line-total">{formatPrice(Number(product.price) * quantity)}</strong>
              <button
                className="remove"
                onClick={() => removeFromCart(product.id)}
                aria-label={`Remove ${product.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <aside className="summary">
          <h2>Order summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <button className="btn btn-primary btn-block" onClick={() => navigate('/checkout')}>
            Go to checkout
          </button>
        </aside>
      </div>
    </>
  );
}
