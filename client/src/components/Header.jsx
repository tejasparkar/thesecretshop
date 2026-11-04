import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getLenis } from '../hooks/useSmoothScroll.js';
import Magnetic from './Magnetic.jsx';
import Logo from './Logo.jsx';

export default function Header({ categories = [] }) {
  const { totals, setOpen } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const { pathname } = useLocation();

  // Hide on scroll down, reveal on scroll up.
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > last && y > 160 && !menu);
      setScrolled(y > 40);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [menu]);

  useEffect(() => setMenu(false), [pathname]);

  useEffect(() => {
    const lenis = getLenis();
    if (menu) lenis?.stop();
    else lenis?.start();
    document.body.style.overflow = menu ? 'hidden' : '';
  }, [menu]);

  return (
    <>
      <header className={`header ${hidden ? 'is-hidden' : ''} ${scrolled ? 'is-scrolled' : ''}`}>
        <Logo />

        <nav className="header__nav">
          <NavLink to="/shop">Shop</NavLink>
          {categories.slice(0, 3).map((c) => (
            <NavLink key={c._id} to={`/shop/${c.slug}`}>{c.name}</NavLink>
          ))}
        </nav>

        <div className="header__actions">
          {user ? (
            <>
              {isAdmin && <Link to="/admin" className="pill pill--ghost">Admin</Link>}
              <Link to="/account/orders" className="header__link">Orders</Link>
              <button className="header__link" onClick={logout}>Sign out</button>
            </>
          ) : (
            <Link to="/login" className="header__link">Sign in</Link>
          )}
          <Magnetic>
            <button className="cart-btn" onClick={() => setOpen(true)} aria-label="Open cart">
              Cart <span>{totals.count}</span>
            </button>
          </Magnetic>
          <button className={`burger ${menu ? 'is-open' : ''}`} onClick={() => setMenu((m) => !m)} aria-label="Menu">
            <span /><span />
          </button>
        </div>
      </header>

      <div className={`menu ${menu ? 'is-open' : ''}`}>
        <nav>
          {[{ name: 'Home', slug: '' }, { name: 'All products', slug: 'shop' }, ...categories.map((c) => ({ name: c.name, slug: `shop/${c.slug}` }))].map((l, i) => (
            <Link key={l.slug} to={`/${l.slug}`} style={{ transitionDelay: `${menu ? 0.1 + i * 0.05 : 0}s` }}>
              <small>0{i + 1}</small>
              {l.name}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
