import React, { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ADMIN_NAV_ITEMS, getAdminPageMeta } from '../adminRoutes.js';
import { useAdminAuth } from '../auth/AdminAuthProvider.jsx';

function buildBreadcrumbs(pathname) {
  const segments = pathname.split('/').filter(Boolean).slice(1);
  const crumbs = [{ label: 'Admin', href: '/admin' }];

  if (segments[0]) {
    const href = `/admin/${segments[0]}`;
    const match = ADMIN_NAV_ITEMS.find((item) => item.href === href);
    crumbs.push({ label: match?.label || segments[0], href });
  }

  if (segments[1]) {
    crumbs.push({
      label: segments[1] === 'new' ? 'New' : 'Edit',
      href: pathname,
    });
  }

  return crumbs;
}

export default function AdminShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const auth = useAdminAuth();
  const meta = getAdminPageMeta(location.pathname);
  const breadcrumbs = useMemo(() => buildBreadcrumbs(location.pathname), [location.pathname]);

  return (
    <div className="admin-shell">
      <button
        type="button"
        className={`admin-shell__backdrop${menuOpen ? ' is-open' : ''}`}
        aria-hidden={!menuOpen}
        tabIndex={menuOpen ? 0 : -1}
        onClick={() => setMenuOpen(false)}
      />

      <aside id="admin-navigation" className={`admin-sidebar${menuOpen ? ' is-open' : ''}`}>
        <div className="admin-sidebar__brand">
          <Link to="/admin" className="admin-brand" onClick={() => setMenuOpen(false)}>
            <span className="admin-brand__mark" aria-hidden="true" />
            <span>
              <strong>AK / CMS</strong>
              <small>Editorial workspace</small>
            </span>
          </Link>
        </div>

        <nav className="admin-nav" aria-label="Admin sections">
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.key}
              to={item.href}
              end={item.href === '/admin'}
              className={({ isActive }) => `admin-nav__link${isActive ? ' is-active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <p>Public delivery stays static and prerendered.</p>
          <p>Drafts remain private until the publish pipeline is added.</p>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__leading">
            <button
              type="button"
              className="admin-menuButton"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="admin-navigation"
            >
              Menu
            </button>

            <div className="admin-heading">
              <div className="admin-breadcrumbs" aria-label="Breadcrumb">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.href}>
                    {index > 0 ? <span className="admin-breadcrumbs__sep">/</span> : null}
                    <Link to={crumb.href}>{crumb.label}</Link>
                  </React.Fragment>
                ))}
              </div>
              <h1 className="admin-heading__title">{meta.title}</h1>
              <p className="admin-heading__description">{meta.description}</p>
            </div>
          </div>

          <details className="admin-account">
            <summary className="admin-account__summary">
              <span className="admin-account__avatar" aria-hidden="true">
                {(auth.email || 'AK').slice(0, 2).toUpperCase()}
              </span>
              <span className="admin-account__meta">
                <strong>{auth.email || 'Administrator'}</strong>
                <small>{auth.authorized ? 'Admin verified' : 'Access pending'}</small>
              </span>
            </summary>

            <div className="admin-account__menu">
              <p>Username: {auth.adminUsername}</p>
              <p>Access email: {auth.email || auth.adminAuthEmail}</p>
              <p>Allowed locally: {auth.allowlisted ? 'yes' : 'no'}</p>
              <p>Firebase claim: {auth.hasClaim ? 'present' : 'not required / missing'}</p>
              <button type="button" className="admin-button admin-button--ghost" onClick={auth.signOut}>
                Sign out
              </button>
            </div>
          </details>
        </header>

        <main className="admin-stage">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
