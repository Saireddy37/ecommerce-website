import { useEffect, useRef, useState } from 'react';
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
  const [active, setActive] = useState(0);
  const touchStartX = useRef(null);

  useEffect(() => {
    setProduct(null);
    setError('');
    setActive(0);
    api(`/products/${id}`)
      .then(setProduct)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="notice error">{error}</p>;
  if (!product) return <p className="notice">Loading...</p>;

  // Older products only have one photo (image_url), newer ones have a list
  const images = product.images && product.images.length ? product.images : [product.image_url];
  const soldOut = product.stock < 1;

  function go(delta) {
    setActive((i) => (i + delta + images.length) % images.length);
  }

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 40 && images.length > 1) go(dx < 0 ? 1 : -1);
  }

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
        <div className="gallery">
          <div className="gallery-main" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <img className="detail-image" src={images[active]} alt={product.name} />
            {images.length > 1 && (
              <>
                <button className="gallery-arrow left" onClick={() => go(-1)} aria-label="Previous photo">
                  ‹
                </button>
                <button className="gallery-arrow right" onClick={() => go(1)} aria-label="Next photo">
                  ›
                </button>
                <span className="gallery-count">
                  {active + 1} / {images.length}
                </span>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((url, i) => (
                <button
                  key={url}
                  className={i === active ? 'active' : ''}
                  onClick={() => setActive(i)}
                  aria-label={`Show photo ${i + 1}`}
                >
                  <img src={url} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

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
