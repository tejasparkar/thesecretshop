import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Logo from '../../components/Logo.jsx';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: '◧', end: true },
  { to: '/admin/orders', label: 'Orders', icon: '▤' },
  { to: '/admin/categories', label: 'Categories', icon: '◫' },
  { to: '/admin/products', label: 'Products', icon: '▣' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const current = NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)));

  return (
    <div className={`admin ${open ? 'nav-open' : ''}`}>
      <aside className="admin__side">
        <Logo scrollTop={false} />
        <span className="admin__tag">Admin</span>
        <nav>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}>
              <i>{n.icon}</i>{n.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin__user">
          <div className="avatar">{user.name[0]}</div>
          <div><b>{user.name}</b><small>{user.email}</small></div>
        </div>
        <div className="admin__links">
          <Link to="/">← View store</Link>
          <button onClick={logout}>Sign out</button>
        </div>
      </aside>
      <div className="admin__scrim" onClick={() => setOpen(false)} />
      <div className="admin__main">
        <header className="admin__top">
          <button className="admin__menu" onClick={() => setOpen(true)} aria-label="Open navigation">☰</button>
          <h1>{current?.label || 'Admin'}</h1>
        </header>
        <div className="admin__content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
