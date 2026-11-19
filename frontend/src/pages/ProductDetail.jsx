import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, formatPrice } from '../api.js';
import { useCart } from '../context/CartContext.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setProduct(null);
    setError('');
    api(`/products/${id}`)
      .then(setProduct)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="notice error">{error}</p>;
  if (!product) return <p className="notice">Loading...</p>;

  const soldOut = product.stock < 1;

  function handleAdd() {
    addToCart(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="detail">
      <Link to="/" className="back">
        ← Back to shop
      </Link>
      <div className="detail-grid">
        <img className="detail-image" src={product.image_url} alt={product.name} />
        <div>
          <span className="tag">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="price big">{formatPrice(product.price)}</p>
          <p className="muted">{product.description}</p>
          <p className={soldOut ? 'stock out' : 'stock'}>
            {soldOut ? 'Out of stock' : `${product.stock} in stock`}
          </p>

          {!soldOut && (
            <div className="buy-row">
              <div className="qty">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Less">
                  −
                </button>
                <span>{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  aria-label="More"
                >
                  +
                </button>
              </div>
              <button className="btn btn-primary" onClick={handleAdd}>
                {added ? 'Added ✓' : 'Add to cart'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
