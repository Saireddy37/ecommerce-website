import { useEffect, useState } from 'react';
import { api, formatPrice } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { uploadImage } from '../upload.js';

const MAX_PHOTOS = 8;
const EMPTY = { name: '', description: '', price: '', stock: '', category: '', images: [] };
const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

export default function Admin() {
  const [tab, setTab] = useState('products');

  return (
    <>
      <h1>Admin</h1>
      <div className="chips tabs">
        <button
          className={`chip ${tab === 'products' ? 'chip-active' : ''}`}
          onClick={() => setTab('products')}
        >
          Products
        </button>
        <button
          className={`chip ${tab === 'orders' ? 'chip-active' : ''}`}
          onClick={() => setTab('orders')}
        >
          Orders
        </button>
      </div>
      {tab === 'products' ? <ProductsTab /> : <OrdersTab />}
    </>
  );
}

function ProductsTab() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const uploading = uploadStatus !== '';

  function load() {
    api('/products')
      .then(setProducts)
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  function change(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  function reset() {
    setForm(EMPTY);
    setEditingId(null);
  }

  function startEdit(p) {
    setForm({
      name: p.name,
      description: p.description || '',
      price: p.price,
      stock: p.stock,
      category: p.category || '',
      images: p.images && p.images.length ? p.images : p.image_url ? [p.image_url] : [],
    });
    setEditingId(p.id);
    setError('');
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Upload the chosen photos one after another and add each to the product
  async function handlePhotos(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    setError('');
    setMessage('');
    const room = MAX_PHOTOS - form.images.length;
    if (room <= 0) {
      setError(`You can add up to ${MAX_PHOTOS} photos per product.`);
      return;
    }
    const chosen = files.slice(0, room);
    if (files.length > room) {
      setMessage(`Only ${room} more photo(s) fit, so the rest were skipped.`);
    }

    for (let i = 0; i < chosen.length; i++) {
      setUploadStatus(`Uploading photo ${i + 1} of ${chosen.length}...`);
      try {
        const url = await uploadImage(chosen[i], token);
        setForm((f) => ({ ...f, images: [...f.images, url] }));
      } catch (err) {
        setError(`Photo ${i + 1} failed: ${err.message}`);
        break;
      }
    }
    setUploadStatus('');
  }

  function makeMain(index) {
    setForm((f) => {
      const images = [...f.images];
      const [picked] = images.splice(index, 1);
      return { ...f, images: [picked, ...images] };
    });
  }

  function removePhoto(index) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const body = {
        name: form.name,
        description: form.description,
        category: form.category,
        price: Number(form.price),
        stock: Number(form.stock),
        images: form.images,
      };
      if (editingId) {
        await api(`/products/${editingId}`, { method: 'PUT', token, body });
        setMessage('Product updated.');
      } else {
        await api('/products', { method: 'POST', token, body });
        setMessage('Product added.');
      }
      reset();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(p) {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    setError('');
    setMessage('');
    try {
      await api(`/products/${p.id}`, { method: 'DELETE', token });
      setMessage('Product deleted.');
      if (editingId === p.id) reset();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <form className="admin-form" onSubmit={submit}>
        <h2>{editingId ? `Edit product #${editingId}` : 'Add a product'}</h2>
        {error && <p className="notice error">{error}</p>}
        {message && <p className="notice success">{message}</p>}
        <div className="admin-fields">
          <label>
            Name
            <input required value={form.name} onChange={change('name')} />
          </label>
          <label>
            Category
            <input value={form.category} onChange={change('category')} placeholder="e.g. Sarees" />
          </label>
          <label>
            Price (₹)
            <input required type="number" min="0" step="0.01" value={form.price} onChange={change('price')} />
          </label>
          <label>
            Stock
            <input required type="number" min="0" step="1" value={form.stock} onChange={change('stock')} />
          </label>
          <label className="wide">
            Description
            <input value={form.description} onChange={change('description')} />
          </label>

          <label className="wide">
            Photos ({form.images.length} of {MAX_PHOTOS}). You can pick several at once from your gallery.
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotos}
              disabled={uploading || form.images.length >= MAX_PHOTOS}
            />
            {uploading && <span className="muted small">{uploadStatus}</span>}
          </label>

          {form.images.length > 0 && (
            <div className="wide photo-grid">
              {form.images.map((url, i) => (
                <div className="photo-item" key={url}>
                  <img src={url} alt={`Photo ${i + 1}`} />
                  {i === 0 && <span className="photo-main">Main</span>}
                  <div className="photo-actions">
                    {i !== 0 && (
                      <button type="button" onClick={() => makeMain(i)}>
                        Make main
                      </button>
                    )}
                    <button type="button" onClick={() => removePhoto(i)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="admin-actions">
          <button className="btn btn-primary" disabled={busy || uploading}>
            {busy ? 'Saving...' : uploading ? 'Uploading photos...' : editingId ? 'Save changes' : 'Add product'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={reset}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <img className="thumb" src={p.image_url} alt="" />
                </td>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>{formatPrice(p.price)}</td>
                <td className={p.stock < 1 ? 'low' : ''}>{p.stock}</td>
                <td className="row-actions">
                  <button className="btn btn-ghost btn-small" onClick={() => startEdit(p)}>
                    Edit
                  </button>
                  <button className="btn btn-ghost btn-small danger" onClick={() => remove(p)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function OrdersTab() {
  const { token } = useAuth();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  function load() {
    api('/orders', { token })
      .then(setOrders)
      .catch((e) => setError(e.message));
  }

  useEffect(load, [token]);

  async function changeStatus(order, status) {
    if (status === 'cancelled' && !window.confirm(`Cancel order #${order.id}? Its items go back into stock.`)) {
      return;
    }
    setError('');
    try {
      await api(`/orders/${order.id}/status`, { method: 'PATCH', token, body: { status } });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      {error && <p className="notice error">{error}</p>}
      {!orders && !error && <p className="notice">Loading...</p>}
      {orders && orders.length === 0 && <p className="notice">No orders yet.</p>}

      {orders &&
        orders.map((o) => (
          <section className="order" key={o.id}>
            <header>
              <div>
                <strong>Order #{o.id}</strong>
                <span className="muted">
                  {' '}
                  · {new Date(o.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
                <div className="muted small">
                  {o.customer_name} ({o.customer_email})
                </div>
              </div>
              <select
                className="status-select"
                value={o.status}
                disabled={o.status === 'cancelled'}
                onChange={(e) => changeStatus(o, e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
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
