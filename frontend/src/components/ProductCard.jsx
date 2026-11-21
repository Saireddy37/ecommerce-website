import { Link } from 'react-router-dom';
import { formatPrice } from '../api.js';
import { useCart } from '../context/CartContext.jsx';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const soldOut = product.stock < 1;
  const fewLeft = !soldOut && product.stock <= 3;

  return (
    <article className="card">
      <Link to={`/product/${product.id}`} className="card-image">
        <img src={product.image_url} alt={product.name} loading="lazy" />
        {soldOut && <span className="card-badge out">Sold out</span>}
        {fewLeft && <span className="card-badge">Only {product.stock} left</span>}
      </Link>
      <div className="card-body">
        {product.category && <span className="tag">{product.category}</span>}
        <h3>
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>
        <div className="card-footer">
          <strong className="price">{formatPrice(product.price)}</strong>
          <button
            className="btn btn-primary btn-small"
            disabled={soldOut}
            onClick={() => addToCart(product)}
          >
            {soldOut ? 'Sold out' : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  );
}
