import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { money } from '../lib/format.js';
import Img from './Img.jsx';

export default function ProductCard({ product, index }) {
  const { add } = useCart();
  const off = product.comparePrice > product.price ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;

  return (
    <article className="pcard" data-reveal>
      <Link to={`/product/${product.slug}`} className="pcard__media" data-cursor="View">
        <Img src={product.images?.[0]} alt={product.name} />
        {off > 0 && <span className="badge">−{off}%</span>}
        {product.stock === 0 && <span className="badge badge--dark">Sold out</span>}
        {index !== undefined && <span className="pcard__index">{String(index + 1).padStart(2, '0')}</span>}
      </Link>
      <div className="pcard__body">
        <div>
          <p className="pcard__brand">{product.brand}</p>
          <Link to={`/product/${product.slug}`} className="pcard__name">{product.name}</Link>
        </div>
        <div className="pcard__price">
          <span>{money(product.price)}</span>
          {off > 0 && <s>{money(product.comparePrice)}</s>}
        </div>
      </div>
      <button className="pcard__add" onClick={() => add(product)} disabled={product.stock === 0}>
        {product.stock === 0 ? 'Out of stock' : 'Add to cart +'}
      </button>
    </article>
  );
}
