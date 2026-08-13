import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ADMIN_MODULES, ADMIN_NAV_GROUPS, getAdminPageMeta } from '../adminRoutes.js';
import { useAdminAuth } from '../auth/AdminAuthProvider.jsx';
import { useAdminTheme } from '../context/AdminThemeProvider.jsx';
import { useAdminToast } from '../context/AdminToastProvider.jsx';
import { useAdminWorkspace } from '../context/AdminWorkspaceProvider.jsx';
import { useAdminPageActions } from '../context/AdminPageActionsContext.jsx';
import { AdminButton, AdminDialog, AdminToastRegion } from './AdminPrimitives.jsx';
import AdminCommandPalette from './AdminCommandPalette.jsx';
import AdminIcon from './AdminIcon.jsx';

const SIDEBAR_STORAGE_KEY = 'ak-admin-sidebar-collapsed';

function readSidebarState() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
}

function buildBreadcrumbs(pathname) {
  const normalizedPath = pathname.replace(/^\/workspace/, '/admin');
  const segments = normalizedPath.split('/').filter(Boolean).slice(1);
  const crumbs = [{ label: 'Overview', href: '/admin' }];

  if (segments[0]) {
    const module = Object.values(ADMIN_MODULES).find((item) => item.href === `/admin/${segments[0]}`);
    if (module) {
      crumbs.push({ label: module.label, href: module.href });
    }
  }

  if (segments[1]) {
    crumbs.push({
      label: segments[1] === 'new' ? 'New' : 'Editor',
      href: normalizedPath,
    });
  }

  return crumbs;
}

function SidebarGroup({ group, collapsed, onNavigate }) {
  return (
    <div className="admin-sidebarGroup">
      {!collapsed ? <p className="admin-sidebarGroup__label">{group.label}</p> : null}
      <div className="admin-sidebarGroup__items">
        {group.items.map((key) => {
          const item = ADMIN_MODULES[key];
          if (!item) return null;

          return (
            <NavLink
              key={item.key}
              to={item.href}
              end={item.href === '/admin'}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `admin-navLink${isActive ? ' is-active' : ''}${collapsed ? ' is-collapsed' : ''}`
              }
              onClick={onNavigate}
            >
              <span className="admin-navLink__icon">
                <AdminIcon name={item.icon} size={16} />
              </span>
              {!collapsed ? <span className="admin-navLink__label">{item.label}</span> : null}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAdminAuth();
  const { theme, toggleTheme } = useAdminTheme();
  const { toasts, dismissToast, pushToast } = useAdminToast();
  const { insights } = useAdminWorkspace();
  const { actions } = useAdminPageActions();

  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readSidebarState);
  const [commandOpen, setCommandOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');

  const meta = getAdminPageMeta(location.pathname);
  const breadcrumbs = useMemo(() => buildBreadcrumbs(location.pathname), [location.pathname]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
    }
  }, [collapsed]);

  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handleNavigateFromSidebar() {
    setMenuOpen(false);
  }

  async function handleSignOut(force = false) {
    if (!force && actions?.hasUnsavedChanges) {
      setLogoutOpen(true);
      return;
    }

    await auth.signOut();
    navigate('/admin/sign-in?loggedOut=1', { replace: true });
  }

  async function handleSaveAndSignOut() {
    if (actions?.onSave) {
      await actions.onSave();
    }
    setLogoutOpen(false);
    await handleSignOut(true);
  }

  return (
    <div className={`admin-shell${collapsed ? ' is-collapsed' : ''}`}>
      <button
        type="button"
        className={`admin-shell__backdrop${menuOpen ? ' is-open' : ''}`}
        aria-hidden={!menuOpen}
        tabIndex={menuOpen ? 0 : -1}
        onClick={() => setMenuOpen(false)}
      />

      <aside id="admin-navigation" className={`admin-sidebar${menuOpen ? ' is-open' : ''}`}>
        <div className="admin-sidebar__top">
          <Link to="/admin" className="admin-brand" onClick={handleNavigateFromSidebar}>
            <span className="admin-brand__mark" aria-hidden="true">
              <AdminIcon name="sparkles" size={16} />
            </span>
            {!collapsed ? (
              <span className="admin-brand__copy">
                <strong>Atishay CMS</strong>
                <small>Editorial workspace</small>
              </span>
            ) : null}
          </Link>

          <button
            type="button"
            className="admin-iconButton"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed((current) => !current)}
          >
            <AdminIcon name="panelLeft" size={16} />
          </button>
        </div>

        <div className="admin-sidebar__quick">
          <AdminButton
            as={Link}
            to="/admin/blogs/new"
            tone="primary"
            size="sm"
            icon="plus"
            className={collapsed ? 'is-iconOnly' : ''}
            title={collapsed ? 'Quick create' : undefined}
            onClick={handleNavigateFromSidebar}
          >
            {collapsed ? 'New' : 'Quick create'}
          </AdminButton>
        </div>

        <nav className="admin-sidebar__nav" aria-label="Admin sections">
          {ADMIN_NAV_GROUPS.map((group) => (
            <SidebarGroup
              key={group.key}
              group={group}
              collapsed={collapsed}
              onNavigate={handleNavigateFromSidebar}
            />
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <button type="button" className="admin-helpCard" onClick={() => setShortcutsOpen(true)}>
            <span className="admin-helpCard__icon">
              <AdminIcon name="info" size={16} />
            </span>
            {!collapsed ? (
              <span>
                <strong>Keyboard shortcuts</strong>
                <small>Command K to search or navigate.</small>
              </span>
            ) : null}
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__leading">
            <button
              type="button"
              className="admin-iconButton admin-menuButton"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="admin-navigation"
              aria-label="Toggle navigation"
            >
              <AdminIcon name="menu" size={16} />
            </button>

            <div className="admin-topbar__copy">
              <div className="admin-breadcrumbs" aria-label="Breadcrumb">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.href}>
                    {index > 0 ? <span className="admin-breadcrumbs__sep">/</span> : null}
                    <Link to={crumb.href}>{crumb.label}</Link>
                  </React.Fragment>
                ))}
              </div>
              <div className="admin-topbar__titleRow">
                <h1 className="admin-heading__title">{meta.title}</h1>
                <p className="admin-heading__description">{meta.description}</p>
              </div>
            </div>
          </div>

          <div className="admin-topbar__actions">
            <button type="button" className="admin-searchShortcut" onClick={() => setCommandOpen(true)}>
              <AdminIcon name="search" size={15} />
              <span>Search, jump, or create</span>
              <kbd>{isMac ? '⌘K' : 'Ctrl K'}</kbd>
            </button>

            <AdminButton as={Link} to="/" tone="ghost" size="sm" icon="external">
              Preview website
            </AdminButton>

            <details className="admin-popover">
              <summary className="admin-iconButton" aria-label="Open notifications">
                <AdminIcon name="bell" size={16} />
                {insights.length > 0 ? <span className="admin-dot">{insights.length}</span> : null}
              </summary>
              <div className="admin-popover__panel admin-popover__panel--wide">
                <div className="admin-popover__header">
                  <strong>Notifications</strong>
                  <small>{insights.length} items requiring review</small>
                </div>
                <div className="admin-notifications">
                  {insights.length === 0 ? (
                    <p className="admin-muted">No issues need review right now.</p>
                  ) : (
                    insights.slice(0, 6).map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        className="admin-notification"
                        onClick={() => navigate(item.href)}
                      >
                        <span className={`admin-notification__tone admin-notification__tone--${item.level}`} />
                        <span className="admin-notification__copy">
                          <strong>{item.title}</strong>
                          <small>{item.description}</small>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </details>

            <details className="admin-popover admin-popover--account">
              <summary className="admin-accountSummary">
                <span className="admin-accountSummary__avatar" aria-hidden="true">
                  {(auth.email || auth.adminUsername || 'AK').slice(0, 2).toUpperCase()}
                </span>
                <span className="admin-accountSummary__copy">
                  <strong>{auth.adminUsername}</strong>
                  <small>{auth.email || auth.adminAuthEmail}</small>
                </span>
                <AdminIcon name="chevronDown" size={14} />
              </summary>

              <div className="admin-popover__panel">
                <button type="button" className="admin-menuItem" onClick={() => navigate('/admin/settings')}>
                  <AdminIcon name="settings" size={15} />
                  <span>Profile & settings</span>
                </button>
                <button type="button" className="admin-menuItem" onClick={toggleTheme}>
                  <AdminIcon name={theme === 'dark' ? 'sun' : 'moon'} size={15} />
                  <span>Theme: {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}</span>
                </button>
                <button type="button" className="admin-menuItem" onClick={() => setShortcutsOpen(true)}>
                  <AdminIcon name="info" size={15} />
                  <span>Keyboard shortcuts</span>
                </button>
                <button type="button" className="admin-menuItem" onClick={() => navigate('/')}>
                  <AdminIcon name="external" size={15} />
                  <span>View public website</span>
                </button>
                <button type="button" className="admin-menuItem admin-menuItem--danger" onClick={() => handleSignOut(false)}>
                  <AdminIcon name="logout" size={15} />
                  <span>Sign out</span>
                </button>
              </div>
            </details>
          </div>
        </header>

        <main className="admin-stage">
          <Outlet />
        </main>
      </div>

      <AdminCommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />

      <AdminDialog
        open={shortcutsOpen}
        title="Keyboard shortcuts"
        description="Keep the workspace fast from any screen."
        onClose={() => setShortcutsOpen(false)}
      >
        <div className="admin-shortcutList">
          <div><kbd>{isMac ? '⌘K' : 'Ctrl K'}</kbd><span>Open command palette</span></div>
          <div><kbd>Esc</kbd><span>Close dialogs and menus</span></div>
          <div><kbd>Tab</kbd><span>Move through actions and fields</span></div>
          <div><kbd>Enter</kbd><span>Run the selected command</span></div>
        </div>
      </AdminDialog>

      <AdminDialog
        open={logoutOpen}
        title="Sign out with unsaved changes?"
        description={`Your editor still has unsaved changes. Save them to ${workspace.sync.mode === 'firebase' ? 'Firebase CMS' : 'the local workspace'} before signing out?`}
        onClose={() => setLogoutOpen(false)}
        footer={(
          <>
            <AdminButton tone="ghost" onClick={() => setLogoutOpen(false)}>
              Cancel
            </AdminButton>
            <AdminButton tone="danger" onClick={() => { setLogoutOpen(false); handleSignOut(true); }}>
              Discard and sign out
            </AdminButton>
            <AdminButton tone="primary" onClick={handleSaveAndSignOut}>
              Save and sign out
            </AdminButton>
          </>
        )}
      >
        <p className="admin-muted">
          Local drafts are kept in this browser, but saving now makes the latest version the one
          you return to next time.
        </p>
      </AdminDialog>

      <AdminToastRegion toasts={toasts} dismissToast={dismissToast} />
    </div>
  );
}
