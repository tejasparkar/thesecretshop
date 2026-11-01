import { useEffect, useRef, useState } from 'react';
import { Link, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import api from '../lib/api.js';
import useReveal from '../hooks/useReveal.js';
import Lines from '../components/Lines.jsx';
import ProductCard from '../components/ProductCard.jsx';

export default function Shop() {
  const { slug } = useParams();
  const { categories } = useOutletContext();
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ products: [], total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get('q') || '');
  const root = useRef(null);

  const sort = params.get('sort') || 'newest';
  const page = parseInt(params.get('page') || '1', 10);
  const q = params.get('q') || '';
  const category = categories.find((c) => c.slug === slug);

  useEffect(() => {
    setLoading(true);
    api
      .get('/products', { params: { category: slug, sort, page, q: q || undefined, limit: 12 } })
      .then(({ data: d }) => setData(d))
      .finally(() => setLoading(false));
  }, [slug, sort, page, q]);

  useReveal(root, [data.products]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  return (
    <div className="shop wrap" ref={root}>
      <header className="page-hero">
        <p className="eyebrow">( {category ? 'Category' : 'The catalogue'} )</p>
        <Lines as="h1" key={slug || 'all'} lines={category ? [category.name] : ['Every part,', 'one place.']} />
        {category?.description && <p className="page-hero__sub">{category.description}</p>}
      </header>

      <div className="shop__bar">
        <div className="chips">
          <Link to="/shop" className={`chip ${!slug ? 'is-active' : ''}`}>All</Link>
          {categories.map((c) => (
            <Link key={c._id} to={`/shop/${c.slug}`} className={`chip ${slug === c.slug ? 'is-active' : ''}`}>
              {c.name} <small>{c.productCount}</small>
            </Link>
          ))}
        </div>
        <div className="shop__tools">
          <form onSubmit={(e) => { e.preventDefault(); setParam('q', search.trim()); }}>
            <input className="input" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </form>
          <select className="input" value={sort} onChange={(e) => setParam('sort', e.target.value)}>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low → high</option>
            <option value="price-desc">Price: high → low</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <p className="shop__count">{loading ? 'Loading…' : `${data.total} product${data.total === 1 ? '' : 's'}${q ? ` for “${q}”` : ''}`}</p>

      {!loading && data.products.length === 0 ? (
        <div className="empty">
          <p>No products match. Try another search or category.</p>
        </div>
      ) : (
        <div className="grid-3">
          {data.products.map((p) => <ProductCard product={p} key={p._id} />)}
        </div>
      )}

      {data.pages > 1 && (
        <div className="pager">
          {Array.from({ length: data.pages }, (_, i) => (
            <button key={i} className={page === i + 1 ? 'is-active' : ''} onClick={() => setParam('page', String(i + 1))}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
