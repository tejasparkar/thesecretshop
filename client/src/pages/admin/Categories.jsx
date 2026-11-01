import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import Modal from '../../components/Modal.jsx';
import ImageInput from '../../components/ImageInput.jsx';
import Img from '../../components/Img.jsx';

const EMPTY = { name: '', description: '', image: '', isActive: true, sortOrder: 0 };

function CategoryForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial ? { ...EMPTY, ...initial } : EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { name: form.name, description: form.description, image: form.image, isActive: form.isActive, sortOrder: Number(form.sortOrder) };
      if (initial?._id) await api.put(`/categories/${initial._id}`, payload);
      else await api.post('/categories', payload);
      onSaved(initial?._id ? 'Category updated' : 'Category created');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial?._id ? 'Edit category' : 'New category'} onClose={onClose}>
      <form className="admin-form" onSubmit={submit}>
        <label className="field">
          <span>Name *</span>
          <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="field">
          <span>Description</span>
          <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <div className="field">
          <span>Image</span>
          <ImageInput multiple={false} value={form.image ? [form.image] : []} onChange={(urls) => setForm({ ...form, image: urls[0] || '' })} />
        </div>
        <div className="form-grid">
          <label className="field field--half">
            <span>Sort order</span>
            <input className="input" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
          </label>
          <label className="field field--half check">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            <span>Visible in store</span>
          </label>
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="btn-row">
          <button type="button" className="pill pill--ghost" onClick={onClose}>Cancel</button>
          <button className="pill" disabled={busy}>{busy ? 'Saving…' : 'Save category'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminCategories() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null); // null | {} (new) | category
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(() => api.get('/categories', { params: { all: 1 } }).then(({ data }) => setCategories(data)), []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (c) => {
    try {
      await api.put(`/categories/${c._id}`, { isActive: !c.isActive });
      toast(c.isActive ? `"${c.name}" hidden` : `"${c.name}" is live`);
      load();
    } catch (e) {
      toast(errMsg(e), 'error');
    }
  };

  const remove = async (c) => {
    try {
      await api.delete(`/categories/${c._id}`);
      toast('Category deleted');
      load();
    } catch (e) {
      toast(errMsg(e), 'error');
    } finally {
      setConfirm(null);
    }
  };

  return (
    <div>
      <div className="toolbar">
        <p className="muted">{categories.length} categories</p>
        <button className="pill" onClick={() => setEditing({})}>+ New category</button>
      </div>

      <div className="cat-grid">
        {categories.map((c) => (
          <div className={`cat-card ${c.isActive ? '' : 'is-off'}`} key={c._id}>
            <div className="cat-card__img"><Img src={c.image} alt={c.name} /></div>
            <div className="cat-card__body">
              <div className="cat-card__title">
                <h4>{c.name}</h4>
                <span className={`status ${c.isActive ? 'status--delivered' : 'status--cancelled'}`}>{c.isActive ? 'Live' : 'Hidden'}</span>
              </div>
              <p className="muted">{c.description || 'No description'}</p>
              <small className="muted">/{c.slug} · {c.productCount} products · order {c.sortOrder}</small>
              <div className="btn-row">
                <button className="pill pill--ghost" onClick={() => setEditing(c)}>Edit</button>
                <button className="pill pill--ghost" onClick={() => toggle(c)}>{c.isActive ? 'Hide' : 'Show'}</button>
                {confirm === c._id ? (
                  <>
                    <button className="pill pill--danger" onClick={() => remove(c)}>Confirm delete</button>
                    <button className="pill pill--ghost" onClick={() => setConfirm(null)}>Keep</button>
                  </>
                ) : (
                  <button className="pill pill--ghost text-danger" onClick={() => setConfirm(c._id)}>Delete</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <CategoryForm
          initial={editing._id ? editing : null}
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
