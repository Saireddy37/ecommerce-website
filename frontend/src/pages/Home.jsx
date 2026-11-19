import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import ProductCard from '../components/ProductCard.jsx';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    api('/products')
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => ['All', ...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  );

  const visible = products.filter(
    (p) =>
      (category === 'All' || p.category === category) &&
      p.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <>
      <section className="hero">
        <h1>Good things, delivered.</h1>
        <p>Browse the collection and check out in a minute.</p>
      </section>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search products"
        />
        <div className="chips">
          {categories.map((c) => (
            <button
              key={c}
              className={`chip ${c === category ? 'chip-active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="notice">Loading products...</p>}
      {error && <p className="notice error">{error}</p>}
      {!loading && !error && visible.length === 0 && (
        <p className="notice">No products match your search.</p>
      )}

      <div className="grid">
        {visible.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </>
  );
}
