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
        <div className="hero-inner">
          <h1>Sarees for every celebration</h1>
          <p>Browse our latest sarees, pick your favourite and order in a few taps.</p>
          <a href="#collection" className="btn btn-gold">
            Shop sarees
          </a>
        </div>
        <div className="hero-art">
          <img src="/logo.png" alt="Sri Kumudha Trends" />
        </div>
      </section>

      <div className="section-title" id="collection">
        <h2>Our sarees</h2>
      </div>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search sarees"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search sarees"
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

      {loading && <p className="notice">Loading sarees...</p>}
      {error && <p className="notice error">{error}</p>}
      {!loading && !error && visible.length === 0 && (
        <p className="notice">No sarees match your search. Try another word, or choose All.</p>
      )}

      <div className="grid">
        {visible.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </>
  );
}
