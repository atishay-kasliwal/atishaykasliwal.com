import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ADMIN_MODULES } from '../adminRoutes.js';
import { useAdminToast } from '../context/AdminToastProvider.jsx';
import { useAdminWorkspace } from '../context/AdminWorkspaceProvider.jsx';
import { AdminBadge, AdminButton, AdminDialog, AdminEmptyState, AdminPanel, AdminSearchField, AdminSectionHeader, AdminStatusBadge, AdminTabs } from '../components/AdminPrimitives.jsx';
import AdminIcon from '../components/AdminIcon.jsx';
import { filterDocuments, getDocumentFieldValue, getModuleViewConfig, getPreviewPath, sortDocuments } from '../lib/moduleViews.js';

const PAGE_SIZE = 10;

function readFilterState(moduleKey, fallback) {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(`ak-admin-filters-${moduleKey}`);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

export default function AdminCollectionPage({ moduleKey }) {
  const module = ADMIN_MODULES[moduleKey];
  const workspace = useAdminWorkspace();
  const navigate = useNavigate();
  const { pushToast } = useAdminToast();

  const docs = workspace.getModuleCollection(moduleKey);
  const config = getModuleViewConfig(moduleKey);

  const [query, setQuery] = useState(() => readFilterState(moduleKey, { query: '' }).query || '');
  const [status, setStatus] = useState(() => readFilterState(moduleKey, { status: 'all' }).status || 'all');
  const [visibility, setVisibility] = useState(() => readFilterState(moduleKey, { visibility: 'all' }).visibility || 'all');
  const [category, setCategory] = useState(() => readFilterState(moduleKey, { category: 'all' }).category || 'all');
  const [sort, setSort] = useState(() => readFilterState(moduleKey, { sort: config.sortOptions[0]?.value || 'updated-desc' }).sort || config.sortOptions[0]?.value || 'updated-desc');
  const [view, setView] = useState(module.supportsGrid ? 'table' : 'table');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        `ak-admin-filters-${moduleKey}`,
        JSON.stringify({ query, status, visibility, category, sort })
      );
    }
  }, [category, moduleKey, query, sort, status, visibility]);

  const categoryOptions = useMemo(() => {
    const values = new Set();
    docs.forEach((item) => {
      const next = item.category || item.type || item.tag || item.watchStatus || '';
      if (next) values.add(next);
    });
    return ['all', ...Array.from(values)];
  }, [docs]);

  const filtered = useMemo(() => {
    const next = filterDocuments(docs, query, { status, visibility, category }, config);
    return sortDocuments(next, sort);
  }, [category, config, docs, query, sort, status, visibility]);

  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  function toggleSelected(id) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function handleBulkAction(type) {
    if (selected.length === 0) return;
    setConfirm({ type, ids: selected });
  }

  function applyConfirmedAction() {
    if (!confirm) return;
    const ids = confirm.ids;

    if (confirm.type === 'archive') {
      workspace.archiveDocuments(moduleKey, ids, { notifySyncError: true });
      pushToast({ tone: 'success', title: `${ids.length} ${module.label.toLowerCase()} archived` });
    }

    if (confirm.type === 'delete') {
      workspace.removeDocuments(moduleKey, ids, { notifySyncError: true });
      pushToast({ tone: 'success', title: `${ids.length} ${module.label.toLowerCase()} moved to deleted` });
    }

    if (confirm.type === 'duplicate') {
      ids.forEach((id) => workspace.duplicateDocument(moduleKey, id, { notifySyncError: true }));
      pushToast({ tone: 'success', title: `${ids.length} duplicate drafts created` });
    }

    setSelected([]);
    setConfirm(null);
  }

  return (
    <section className="admin-page">
      <AdminSectionHeader
        eyebrow={module.label}
        title={module.label}
        description={module.description}
        actions={
          <div className="admin-inlineActions">
            {module.supportsGrid ? (
              <AdminTabs
                compact
                items={[
                  { label: 'Table', value: 'table' },
                  { label: 'Grid', value: 'grid' },
                ]}
                value={view}
                onChange={setView}
              />
            ) : null}
            {module.supportsCreate && module.createPath ? (
              <AdminButton as={Link} to={module.createPath} tone="primary" icon="plus">
                Create {module.singular}
              </AdminButton>
            ) : null}
          </div>
        }
      />

      <AdminPanel>
        <div className="admin-toolbar">
          <AdminSearchField
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${module.label.toLowerCase()}…`}
          />
          <div className="admin-toolbar__filters">
            <select className="admin-select admin-select--inline" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
              <option value="archived">Archived</option>
              <option value="deleted">Deleted</option>
            </select>
            <select className="admin-select admin-select--inline" value={visibility} onChange={(event) => setVisibility(event.target.value)}>
              <option value="all">All visibility</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="unlisted">Unlisted</option>
            </select>
            {categoryOptions.length > 1 ? (
              <select className="admin-select admin-select--inline" value={category} onChange={(event) => setCategory(event.target.value)}>
                {categoryOptions.map((item) => (
                  <option key={item} value={item}>
                    {item === 'all' ? 'All groups' : item}
                  </option>
                ))}
              </select>
            ) : null}
            <select className="admin-select admin-select--inline" value={sort} onChange={(event) => setSort(event.target.value)}>
              {config.sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-toolbar admin-toolbar--meta">
          <div className="admin-toolbar__meta">
            <strong>{filtered.length}</strong>
            <span>{module.label.toLowerCase()}</span>
          </div>

          {selected.length > 0 ? (
            <div className="admin-inlineActions">
              <AdminBadge tone="neutral">{selected.length} selected</AdminBadge>
              <AdminButton tone="ghost" size="sm" icon="duplicate" onClick={() => handleBulkAction('duplicate')}>
                Duplicate
              </AdminButton>
              <AdminButton tone="ghost" size="sm" icon="archive" onClick={() => handleBulkAction('archive')}>
                Archive
              </AdminButton>
              <AdminButton tone="danger" size="sm" icon="trash" onClick={() => handleBulkAction('delete')}>
                Delete
              </AdminButton>
            </div>
          ) : null}
        </div>

        {filtered.length === 0 ? (
          <AdminEmptyState
            icon="search"
            title={`No ${module.label.toLowerCase()} match the current filters`}
            description="Try clearing filters or create a new item to start building this section."
            action={
              module.supportsCreate && module.createPath ? (
                <AdminButton as={Link} to={module.createPath} tone="primary" icon="plus">
                  Create {module.singular}
                </AdminButton>
              ) : null
            }
          />
        ) : view === 'grid' ? (
          <div className="admin-cardGrid">
            {paged.map((item) => (
              <article key={item.id} className="admin-entityCard">
                <div className="admin-entityCard__media">
                  {item.coverImage || item.src ? (
                    <img src={item.coverImage || item.src} alt={item.title} />
                  ) : (
                    <span className="admin-entityCard__mediaFallback">
                      <AdminIcon name={module.icon} size={18} />
                    </span>
                  )}
                </div>
                <div className="admin-entityCard__body">
                  <div className="admin-entityCard__meta">
                    <AdminStatusBadge status={item.status} />
                    {item.visibility ? <AdminBadge tone="neutral">{item.visibility}</AdminBadge> : null}
                  </div>
                  <strong>{item.title}</strong>
                  <p>{item.tagline || item.quote || item.description || item.creator || item.organization || item.role || 'No summary available yet.'}</p>
                </div>
                <div className="admin-entityCard__actions">
                  <AdminButton tone="ghost" size="sm" onClick={() => navigate(`${module.href}/${item.id}`)}>
                    Edit
                  </AdminButton>
                  <AdminButton as={Link} tone="ghost" size="sm" to={getPreviewPath(moduleKey, item)}>
                    Preview
                  </AdminButton>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-tableWrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selected.length > 0 && selected.length === paged.length}
                      onChange={(event) =>
                        setSelected(event.target.checked ? paged.map((item) => item.id) : [])
                      }
                      aria-label="Select current page"
                    />
                  </th>
                  {config.columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {paged.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Select">
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        onChange={() => toggleSelected(item.id)}
                        aria-label={`Select ${item.title}`}
                      />
                    </td>
                    {config.columns.map((column) => (
                      <td key={column.key} data-label={column.label}>
                        {column.key === 'title' ? (
                          <div className="admin-table__titleCell">
                            <button type="button" className="admin-table__titleButton" onClick={() => navigate(`${module.href}/${item.id}`)}>
                              {item.title}
                            </button>
                            <small>{item.slug}</small>
                          </div>
                        ) : column.key === 'status' ? (
                          <AdminStatusBadge status={item.status} />
                        ) : column.key === 'featured' ? (
                          item.featured ? <AdminBadge tone="success">Featured</AdminBadge> : <span className="admin-table__empty">—</span>
                        ) : (
                          getDocumentFieldValue(item, column.key)
                        )}
                      </td>
                    ))}
                    <td data-label="Actions">
                      <div className="admin-rowActions">
                        <button type="button" className="admin-iconButton" onClick={() => navigate(`${module.href}/${item.id}`)} aria-label={`Edit ${item.title}`}>
                          <AdminIcon name="edit" size={15} />
                        </button>
                        <Link className="admin-iconButton" to={getPreviewPath(moduleKey, item)} aria-label={`Preview ${item.title}`}>
                          <AdminIcon name="external" size={15} />
                        </Link>
                        <button type="button" className="admin-iconButton" onClick={() => { workspace.duplicateDocument(moduleKey, item.id, { notifySyncError: true }); pushToast({ tone: 'success', title: `Duplicate created for ${item.title}` }); }} aria-label={`Duplicate ${item.title}`}>
                          <AdminIcon name="duplicate" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pageCount > 1 ? (
          <div className="admin-pagination">
            <AdminButton tone="ghost" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
              Previous
            </AdminButton>
            <span>
              Page {page} of {pageCount}
            </span>
            <AdminButton tone="ghost" size="sm" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page >= pageCount}>
              Next
            </AdminButton>
          </div>
        ) : null}
      </AdminPanel>

      <AdminDialog
        open={Boolean(confirm)}
        title={`${confirm?.type === 'delete' ? 'Delete' : confirm?.type === 'archive' ? 'Archive' : 'Duplicate'} selected items?`}
        description={workspace.sync.mode === 'firebase' ? 'This updates the live Firebase CMS and keeps local fallback copies only if sync fails.' : 'This updates the local workspace state in this browser.'}
        onClose={() => setConfirm(null)}
        footer={(
          <>
            <AdminButton tone="ghost" onClick={() => setConfirm(null)}>
              Cancel
            </AdminButton>
            <AdminButton tone={confirm?.type === 'delete' ? 'danger' : 'primary'} onClick={applyConfirmedAction}>
              Confirm
            </AdminButton>
          </>
        )}
      >
        <p className="admin-muted">
          {confirm?.ids?.length || 0} {module.label.toLowerCase()} will be updated in {workspace.sync.mode === 'firebase' ? 'Firebase CMS' : 'the private local workspace'}.
        </p>
      </AdminDialog>
    </section>
  );
}
