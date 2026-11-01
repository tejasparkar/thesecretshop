import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../../lib/api.js';
import { money } from '../../lib/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import Modal from '../../components/Modal.jsx';
import ImageInput from '../../components/ImageInput.jsx';
import Img from '../../components/Img.jsx';

const EMPTY = {
  name: '', brand: '', category: '', description: '', price: '', comparePrice: '', stock: '',
  images: [], specs: [], isFeatured: false, isActive: true,
};

function ProductForm({ initial, categories, onClose, onSaved }) {
  const [form, setForm] = useState(() =>
    initial ? { ...EMPTY, ...initial, category: initial.category?._id || initial.category } : { ...EMPTY, category: categories[0]?._id || '' }
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const setSpec = (i, key, val) => setForm({ ...form, specs: form.specs.map((s, k) => (k === i ? { ...s, [key]: val } : s)) });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const payload = {
      ...form,
      price: Number(form.price),
      comparePrice: Number(form.comparePrice) || 0,
      stock: Number(form.stock) || 0,
      specs: form.specs.filter((s) => s.label && s.value),
    };
    delete payload._id;
    try {
      if (initial?._id) await api.put(`/products/${initial._id}`, payload);
      else await api.post('/products', payload);
      onSaved(initial?._id ? 'Product updated' : 'Product created');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial?._id ? 'Edit product' : 'New product'} onClose={onClose} wide>
      <form className="admin-form" onSubmit={submit}>
        <div className="form-grid">
          <label className="field field--half"><span>Name *</span><input className="input" required value={form.name} onChange={set('name')} /></label>
          <label className="field field--half"><span>Brand</span><input className="input" value={form.brand} onChange={set('brand')} /></label>
          <label className="field field--half">
            <span>Category *</span>
            <select className="input" required value={form.category} onChange={set('category')}>
              <option value="" disabled>Select…</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </label>
          <label className="field field--half"><span>Stock *</span><input className="input" type="number" min="0" required value={form.stock} onChange={set('stock')} /></label>
          <label className="field field--half"><span>Price (₹) *</span><input className="input" type="number" min="0" required value={form.price} onChange={set('price')} /></label>
          <label className="field field--half"><span>Compare-at price (₹)</span><input className="input" type="number" min="0" value={form.comparePrice} onChange={set('comparePrice')} /></label>
          <label className="field field--full"><span>Description</span><textarea className="input" rows={3} value={form.description} onChange={set('description')} /></label>
        </div>

        <div className="field">
          <span>Images</span>
          <ImageInput value={form.images} onChange={(images) => setForm({ ...form, images })} />
        </div>

        <div className="field">
          <span>Specifications</span>
          {form.specs.map((s, i) => (
            <div className="inline-form" key={i}>
              <input className="input" placeholder="Label (e.g. VRAM)" value={s.label} onChange={(e) => setSpec(i, 'label', e.target.value)} />
              <input className="input" placeholder="Value (e.g. 16GB GDDR7)" value={s.value} onChange={(e) => setSpec(i, 'value', e.target.value)} />
              <button type="button" className="pill pill--ghost" onClick={() => setForm({ ...form, specs: form.specs.filter((_, k) => k !== i) })}>✕</button>
            </div>
          ))}
          <button type="button" className="pill pill--ghost" onClick={() => setForm({ ...form, specs: [...form.specs, { label: '', value: '' }] })}>+ Add spec</button>
        </div>

        <div className="form-grid">
          <label className="field field--half check"><input type="checkbox" checked={form.isActive} onChange={set('isActive')} /><span>Visible in store</span></label>
          <label className="field field--half check"><input type="checkbox" checked={form.isFeatured} onChange={set('isFeatured')} /><span>Featured on home page</span></label>
        </div>

        {error && <p className="form-error">{error}</p>}
        <div className="btn-row">
          <button type="button" className="pill pill--ghost" onClick={onClose}>Cancel</button>
          <button className="pill" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminProducts() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(() => {
    api.get('/products', { params: { all: 1, limit: 100, category: filter || undefined } }).then(({ data }) => setProducts(data.products));
  }, [filter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/categories', { params: { all: 1 } }).then(({ data }) => setCategories(data)); }, []);

  const remove = async (p) => {
    try {
      await api.delete(`/products/${p._id}`);
      toast('Product deleted');
      load();
    } catch (e) {
      toast(errMsg(e), 'error');
    } finally {
      setConfirm(null);
    }
  };

  const shown = products.filter((p) => `${p.name} ${p.brand}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="toolbar">
        <div className="inline-form">
          <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c._id} value={c.slug}>{c.name}</option>)}
          </select>
          <input className="input" placeholder="Filter by name or brand" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="pill" onClick={() => setEditing({})} disabled={!categories.length} title={categories.length ? '' : 'Create a category first'}>
          + New product
        </button>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Product</th><th>Category</th><th className="num">Price</th><th className="num">Stock</th><th>Status</th><th /></tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="prod-cell">
                      <Img src={p.images[0]} alt={p.name} />
                      <div><b>{p.name}</b><small className="muted">{p.brand}</small></div>
                    </div>
                  </td>
                  <td>{p.category?.name}</td>
                  <td className="num">{money(p.price)}</td>
                  <td className={`num ${p.stock === 0 ? 'text-danger' : p.stock <= 5 ? 'text-warn' : ''}`}>{p.stock}</td>
                  <td>
                    <span className={`status ${p.isActive ? 'status--delivered' : 'status--cancelled'}`}>{p.isActive ? 'Live' : 'Hidden'}</span>
                    {p.isFeatured && <span className="status status--processing">Featured</span>}
                  </td>
                  <td className="actions">
                    <button className="pill pill--ghost" onClick={() => setEditing(p)}>Edit</button>
                    {confirm === p._id ? (
                      <button className="pill pill--danger" onClick={() => remove(p)}>Confirm</button>
                    ) : (
                      <button className="pill pill--ghost text-danger" onClick={() => setConfirm(p._id)}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan={6} className="muted center">No products.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <ProductForm
          initial={editing._id ? editing : null}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            toast(msg);
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}
