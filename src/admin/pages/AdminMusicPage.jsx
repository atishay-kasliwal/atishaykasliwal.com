import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminToast } from '../context/AdminToastProvider.jsx';
import { useAdminWorkspace } from '../context/AdminWorkspaceProvider.jsx';
import { AdminBadge, AdminButton, AdminDialog, AdminEmptyState, AdminPanel, AdminSearchField, AdminSectionHeader, AdminStatusBadge, AdminTabs } from '../components/AdminPrimitives.jsx';
import AdminIcon from '../components/AdminIcon.jsx';
import { classNames, formatAdminDate } from '../lib/adminUtils.js';
import { getPreviewPath } from '../lib/moduleViews.js';

const MUSIC_TABS = [
  { label: 'All entries', value: 'entries' },
  { label: 'Monthly collections', value: 'monthly' },
  { label: 'All time favorites', value: 'favorites' },
  { label: 'Drafts', value: 'drafts' },
];

const SORT_OPTIONS = [
  { label: 'Recently updated', value: 'updated-desc' },
  { label: 'Title A-Z', value: 'title-asc' },
  { label: 'Artist A-Z', value: 'creator-asc' },
  { label: 'Rank', value: 'displayOrder-asc' },
];

function sortEntries(entries, value) {
  const [field, direction] = value.split('-');
  const factor = direction === 'desc' ? -1 : 1;

  return [...entries].sort((left, right) => {
    const a =
      field === 'updated'
        ? left.updatedAt || left.publishedAt || left.createdAt
        : left[field];
    const b =
      field === 'updated'
        ? right.updatedAt || right.publishedAt || right.createdAt
        : right[field];

    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;

    if (field === 'updated') {
      return (new Date(a) - new Date(b)) * factor;
    }

    if (typeof a === 'number' || typeof b === 'number') {
      return ((Number(a) || 0) - (Number(b) || 0)) * factor;
    }

    return String(a).localeCompare(String(b), undefined, { numeric: true }) * factor;
  });
}

function matchesEntry(entry, query, collectionMap) {
  if (!query) return true;

  const collectionTitles = (entry.collectionIds || [])
    .map((id) => collectionMap.get(id)?.title)
    .filter(Boolean)
    .join(' ');

  const haystack = [
    entry.title,
    entry.slug,
    entry.creator,
    entry.kind,
    entry.notes,
    entry.monthKey,
    collectionTitles,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

function collectionLabel(entry, collectionMap) {
  const labels = (entry.collectionIds || [])
    .map((id) => collectionMap.get(id)?.title)
    .filter(Boolean);

  return labels.length > 0 ? labels.join(', ') : 'Standalone';
}

function entryRank(collection, entryId) {
  const index = (collection?.entryIds || []).indexOf(entryId);
  return index >= 0 ? index + 1 : null;
}

function MusicEntryGrid({ entries, collectionMap, selected, onToggleSelected, onEdit, onDuplicate }) {
  return (
    <div className="admin-cardGrid">
      {entries.map((entry) => (
        <article key={entry.id} className="admin-entityCard admin-entityCard--media">
          <label className="admin-entityCard__checkbox">
            <input
              type="checkbox"
              checked={selected.includes(entry.id)}
              onChange={() => onToggleSelected(entry.id)}
              aria-label={`Select ${entry.title}`}
            />
          </label>
          <div className="admin-entityCard__media">
            {entry.coverImage ? (
              <img src={entry.coverImage} alt={entry.title} />
            ) : (
              <span className="admin-entityCard__mediaFallback">
                <AdminIcon name="music" size={18} />
              </span>
            )}
          </div>
          <div className="admin-entityCard__body">
            <div className="admin-entityCard__meta">
              <AdminStatusBadge status={entry.status} />
              <AdminBadge tone="neutral">{entry.kind}</AdminBadge>
            </div>
            <strong>{entry.title}</strong>
            <p>{entry.creator || 'Unknown artist'}</p>
            <small>{collectionLabel(entry, collectionMap)}</small>
          </div>
          <div className="admin-entityCard__actions">
            <AdminButton tone="ghost" size="sm" onClick={() => onEdit(entry.id)}>
              Edit
            </AdminButton>
            <AdminButton as={Link} tone="ghost" size="sm" to={getPreviewPath('music', entry)}>
              Preview
            </AdminButton>
            <AdminButton tone="ghost" size="sm" onClick={() => onDuplicate(entry.id)}>
              Duplicate
            </AdminButton>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function AdminMusicPage() {
  const navigate = useNavigate();
  const workspace = useAdminWorkspace();
  const { pushToast } = useAdminToast();
  const entries = workspace.getCollection('cms_music_entries');
  const collections = workspace.getCollection('cms_music_collections');
  const collectionMap = useMemo(
    () => new Map(collections.map((collection) => [collection.id, collection])),
    [collections]
  );

  const [tab, setTab] = useState('entries');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('updated-desc');
  const [view, setView] = useState('table');
  const [selected, setSelected] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [selectedMonthlyId, setSelectedMonthlyId] = useState('all');
  const [selectedFavoritesId, setSelectedFavoritesId] = useState('all-time');

  const monthlyCollections = useMemo(
    () => collections.filter((item) => item.type === 'monthly').sort((left, right) => (left.monthKey || '').localeCompare(right.monthKey || '') * -1),
    [collections]
  );
  const favoriteCollections = useMemo(
    () => collections.filter((item) => item.type === 'all_time'),
    [collections]
  );

  useEffect(() => {
    if (selectedMonthlyId === 'all' && monthlyCollections.length > 0) {
      setSelectedMonthlyId(monthlyCollections[0].id);
    }
  }, [monthlyCollections, selectedMonthlyId]);

  useEffect(() => {
    if (selectedFavoritesId === 'all-time' && favoriteCollections[0]?.id) {
      setSelectedFavoritesId(favoriteCollections[0].id);
    }
  }, [favoriteCollections, selectedFavoritesId]);

  useEffect(() => {
    setSelected([]);
  }, [tab, query, sort, view]);

  const filteredEntries = useMemo(() => {
    let next = entries.filter((entry) => matchesEntry(entry, query, collectionMap));

    if (tab === 'drafts') {
      next = next.filter((entry) => entry.status === 'draft');
    }

    return sortEntries(next, sort);
  }, [collectionMap, entries, query, sort, tab]);

  const selectedMonthlyCollection =
    monthlyCollections.find((item) => item.id === selectedMonthlyId) || monthlyCollections[0] || null;
  const selectedFavoritesCollection =
    favoriteCollections.find((item) => item.id === selectedFavoritesId) || favoriteCollections[0] || null;

  const monthlyEntries = useMemo(() => {
    if (!selectedMonthlyCollection) return [];
    const ordered = (selectedMonthlyCollection.entryIds || [])
      .map((entryId) => entries.find((entry) => entry.id === entryId))
      .filter(Boolean);

    return ordered.filter((entry) => matchesEntry(entry, query, collectionMap));
  }, [collectionMap, entries, query, selectedMonthlyCollection]);

  const favoriteEntries = useMemo(() => {
    if (selectedFavoritesCollection) {
      return (selectedFavoritesCollection.entryIds || [])
        .map((entryId) => entries.find((entry) => entry.id === entryId))
        .filter(Boolean)
        .filter((entry) => matchesEntry(entry, query, collectionMap));
    }

    return sortEntries(
      entries.filter((entry) => entry.featured && matchesEntry(entry, query, collectionMap)),
      'displayOrder-asc'
    );
  }, [collectionMap, entries, query, selectedFavoritesCollection]);

  const draftCollections = useMemo(
    () => collections.filter((item) => item.status === 'draft'),
    [collections]
  );

  function toggleSelected(id) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function applyBulkAction(type) {
    if (selected.length === 0) return;
    setConfirm({ type, ids: selected });
  }

  function applyConfirmedAction() {
    if (!confirm) return;

    if (confirm.type === 'duplicate') {
      confirm.ids.forEach((id) => workspace.duplicateDocument('music', id, { notifySyncError: true }));
      pushToast({ tone: 'success', title: `${confirm.ids.length} music draft${confirm.ids.length === 1 ? '' : 's'} created` });
    }

    if (confirm.type === 'archive') {
      workspace.archiveDocuments('music', confirm.ids, { notifySyncError: true });
      pushToast({ tone: 'success', title: `${confirm.ids.length} music entr${confirm.ids.length === 1 ? 'y was' : 'ies were'} archived` });
    }

    if (confirm.type === 'delete') {
      workspace.removeDocuments('music', confirm.ids, { notifySyncError: true });
      pushToast({ tone: 'success', title: `${confirm.ids.length} music entr${confirm.ids.length === 1 ? 'y was' : 'ies were'} moved to deleted` });
    }

    setSelected([]);
    setConfirm(null);
  }

  function moveEntry(collection, entryId, direction) {
    if (!collection) return;
    const ids = [...(collection.entryIds || [])];
    const currentIndex = ids.indexOf(entryId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= ids.length) return;

    const [moved] = ids.splice(currentIndex, 1);
    ids.splice(nextIndex, 0, moved);

    workspace.upsertCollectionDocument('cms_music_collections', {
      ...collection,
      entryIds: ids,
    }, {
      notifySyncError: true,
    });

    pushToast({ tone: 'success', title: `Updated ordering for ${collection.title}` });
  }

  function copyArtworkUrl(src) {
    if (!src || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      pushToast({ tone: 'warning', title: 'Clipboard is not available in this browser.' });
      return;
    }

    navigator.clipboard.writeText(src);
    pushToast({ tone: 'success', title: 'Artwork URL copied' });
  }

  const entryCount = filteredEntries.length;
  const draftCount = filteredEntries.filter((entry) => entry.status === 'draft').length;

  return (
    <section className="admin-page">
      <AdminSectionHeader
        eyebrow="Entertainment"
        title="Music"
        description="Manage listening entries, monthly collections, and ranked favorites without touching the public site layout."
        actions={
          <div className="admin-inlineActions">
            <AdminTabs
              compact
              items={[
                { label: 'Table', value: 'table' },
                { label: 'Grid', value: 'grid' },
              ]}
              value={view}
              onChange={setView}
            />
            <AdminButton as={Link} to="/admin/music/collections/new" tone="ghost" icon="plus">
              New collection
            </AdminButton>
            <AdminButton as={Link} to="/admin/music/new" tone="primary" icon="plus">
              Add music entry
            </AdminButton>
          </div>
        }
      />

      <div className="admin-metricGrid admin-metricGrid--compact">
        <AdminPanel className="admin-metricCard">
          <span className="admin-metricCard__label">Entries</span>
          <strong className="admin-metricCard__value">{entries.length}</strong>
        </AdminPanel>
        <AdminPanel className="admin-metricCard">
          <span className="admin-metricCard__label">Collections</span>
          <strong className="admin-metricCard__value">{collections.length}</strong>
        </AdminPanel>
        <AdminPanel className="admin-metricCard">
          <span className="admin-metricCard__label">Drafts</span>
          <strong className="admin-metricCard__value">
            {entries.filter((item) => item.status === 'draft').length + draftCollections.length}
          </strong>
        </AdminPanel>
        <AdminPanel className="admin-metricCard">
          <span className="admin-metricCard__label">Monthly sets</span>
          <strong className="admin-metricCard__value">{monthlyCollections.length}</strong>
        </AdminPanel>
      </div>

      <AdminPanel>
        <div className="admin-toolbar">
          <AdminTabs items={MUSIC_TABS} value={tab} onChange={setTab} compact />
          <div className="admin-toolbar__filters">
            <AdminSearchField
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search titles, artists, notes, and collections…"
            />
            <select className="admin-select admin-select--inline" value={sort} onChange={(event) => setSort(event.target.value)}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {tab === 'entries' ? (
          <>
            <div className="admin-toolbar admin-toolbar--meta">
              <div className="admin-toolbar__meta">
                <strong>{entryCount}</strong>
                <span>music entries</span>
              </div>
              {selected.length > 0 ? (
                <div className="admin-inlineActions">
                  <AdminBadge tone="neutral">{selected.length} selected</AdminBadge>
                  <AdminButton tone="ghost" size="sm" onClick={() => applyBulkAction('duplicate')}>
                    Duplicate
                  </AdminButton>
                  <AdminButton tone="ghost" size="sm" onClick={() => applyBulkAction('archive')}>
                    Archive
                  </AdminButton>
                  <AdminButton tone="danger" size="sm" onClick={() => applyBulkAction('delete')}>
                    Delete
                  </AdminButton>
                </div>
              ) : null}
            </div>

            {filteredEntries.length === 0 ? (
              <AdminEmptyState
                icon="music"
                title="No music entries match the current filters"
                description="Try a broader search or create a new entry for the next listening note."
                action={
                  <AdminButton as={Link} to="/admin/music/new" tone="primary" icon="plus">
                    Add music entry
                  </AdminButton>
                }
              />
            ) : view === 'grid' ? (
              <MusicEntryGrid
                entries={filteredEntries}
                collectionMap={collectionMap}
                selected={selected}
                onToggleSelected={toggleSelected}
                onEdit={(id) => navigate(`/admin/music/${id}`)}
                onDuplicate={(id) => {
                  workspace.duplicateDocument('music', id, { notifySyncError: true });
                  pushToast({ tone: 'success', title: 'Music draft duplicated' });
                }}
              />
            ) : (
              <div className="admin-tableWrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selected.length > 0 && selected.length === filteredEntries.length}
                          onChange={(event) => setSelected(event.target.checked ? filteredEntries.map((item) => item.id) : [])}
                          aria-label="Select all music entries"
                        />
                      </th>
                      <th>Title</th>
                      <th>Artist</th>
                      <th>Type</th>
                      <th>Collection</th>
                      <th>Rank</th>
                      <th>Status</th>
                      <th>Updated</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td data-label="Select">
                          <input
                            type="checkbox"
                            checked={selected.includes(entry.id)}
                            onChange={() => toggleSelected(entry.id)}
                            aria-label={`Select ${entry.title}`}
                          />
                        </td>
                        <td data-label="Title">
                          <div className="admin-table__titleCell">
                            <button type="button" className="admin-table__titleButton" onClick={() => navigate(`/admin/music/${entry.id}`)}>
                              {entry.title}
                            </button>
                            <small>{entry.slug}</small>
                          </div>
                        </td>
                        <td data-label="Artist">{entry.creator || '—'}</td>
                        <td data-label="Type">
                          <AdminBadge tone="neutral">{entry.kind}</AdminBadge>
                        </td>
                        <td data-label="Collection">{collectionLabel(entry, collectionMap)}</td>
                        <td data-label="Rank">{entry.displayOrder ?? '—'}</td>
                        <td data-label="Status">
                          <div className="admin-inlineActions">
                            <AdminStatusBadge status={entry.status} />
                            <AdminBadge tone="neutral">{entry.visibility}</AdminBadge>
                          </div>
                        </td>
                        <td data-label="Updated">{formatAdminDate(entry.updatedAt)}</td>
                        <td data-label="Actions">
                          <div className="admin-rowActions">
                            <button type="button" className="admin-iconButton" onClick={() => navigate(`/admin/music/${entry.id}`)} aria-label={`Edit ${entry.title}`}>
                              <AdminIcon name="edit" size={15} />
                            </button>
                            <Link className="admin-iconButton" to={getPreviewPath('music', entry)} aria-label={`Preview ${entry.title}`}>
                              <AdminIcon name="external" size={15} />
                            </Link>
                            <button type="button" className="admin-iconButton" onClick={() => copyArtworkUrl(entry.coverImage)} aria-label={`Copy artwork URL for ${entry.title}`}>
                              <AdminIcon name="copy" size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}

        {tab === 'monthly' ? (
          <div className="admin-stack">
            {monthlyCollections.length === 0 ? (
              <AdminEmptyState
                icon="music"
                title="No monthly collections yet"
                description="Create a monthly collection to organize listening notes by month."
                action={
                  <AdminButton as={Link} to="/admin/music/collections/new" tone="primary" icon="plus">
                    New collection
                  </AdminButton>
                }
              />
            ) : (
              <>
                <div className="admin-collectionStrip">
                  {monthlyCollections.map((collection) => (
                    <button
                      key={collection.id}
                      type="button"
                      className={classNames('admin-collectionCard', selectedMonthlyCollection?.id === collection.id && 'is-active')}
                      onClick={() => setSelectedMonthlyId(collection.id)}
                    >
                      <strong>{collection.title}</strong>
                      <small>{collection.monthKey || 'Monthly'}</small>
                      <span>{collection.entryIds?.length || 0} entries</span>
                    </button>
                  ))}
                </div>

                <div className="admin-list admin-list--ranked">
                  {monthlyEntries.length === 0 ? (
                    <p className="admin-muted">No entries are assigned to this monthly collection yet.</p>
                  ) : (
                    monthlyEntries.map((entry) => (
                      <div key={entry.id} className="admin-rankRow">
                        <div className="admin-rankRow__index">
                          {entryRank(selectedMonthlyCollection, entry.id) || '—'}
                        </div>
                        <div className="admin-rankRow__copy">
                          <strong>{entry.title}</strong>
                          <small>{entry.creator || 'Unknown artist'} · {entry.kind}</small>
                        </div>
                        <div className="admin-rankRow__actions">
                          <button type="button" className="admin-iconButton" onClick={() => moveEntry(selectedMonthlyCollection, entry.id, -1)} aria-label={`Move ${entry.title} earlier`}>
                            <AdminIcon name="chevronDown" size={14} className="is-rotatedUp" />
                          </button>
                          <button type="button" className="admin-iconButton" onClick={() => moveEntry(selectedMonthlyCollection, entry.id, 1)} aria-label={`Move ${entry.title} later`}>
                            <AdminIcon name="chevronDown" size={14} />
                          </button>
                          <AdminButton tone="ghost" size="sm" onClick={() => navigate(`/admin/music/${entry.id}`)}>
                            Edit
                          </AdminButton>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {selectedMonthlyCollection ? (
                  <div className="admin-inlineActions">
                    <AdminButton as={Link} to={`/admin/music/collections/${selectedMonthlyCollection.id}`} tone="ghost">
                      Edit collection
                    </AdminButton>
                    <AdminButton as={Link} to="/admin/music/new" tone="primary">
                      Add entry
                    </AdminButton>
                  </div>
                ) : null}
              </>
            )}
          </div>
        ) : null}

        {tab === 'favorites' ? (
          <div className="admin-stack">
            {favoriteCollections.length > 0 ? (
              <div className="admin-collectionStrip">
                {favoriteCollections.map((collection) => (
                  <button
                    key={collection.id}
                    type="button"
                    className={classNames('admin-collectionCard', selectedFavoritesCollection?.id === collection.id && 'is-active')}
                    onClick={() => setSelectedFavoritesId(collection.id)}
                  >
                    <strong>{collection.title}</strong>
                    <small>{collection.type.replace('_', ' ')}</small>
                    <span>{collection.entryIds?.length || 0} entries</span>
                  </button>
                ))}
              </div>
            ) : null}

            {favoriteEntries.length === 0 ? (
              <AdminEmptyState
                icon="music"
                title="No favorites are ranked yet"
                description="Use the collection editor to build an all-time favorites list."
                action={
                  <AdminButton as={Link} to="/admin/music/collections/new" tone="primary" icon="plus">
                    Create favorites list
                  </AdminButton>
                }
              />
            ) : (
              <div className="admin-list admin-list--ranked">
                {favoriteEntries.map((entry, index) => (
                  <div key={entry.id} className="admin-rankRow">
                    <div className="admin-rankRow__index">
                      {entryRank(selectedFavoritesCollection, entry.id) || index + 1}
                    </div>
                    <div className="admin-rankRow__copy">
                      <strong>{entry.title}</strong>
                      <small>{entry.creator || 'Unknown artist'} · {entry.kind}</small>
                    </div>
                    <div className="admin-rankRow__actions">
                      {selectedFavoritesCollection ? (
                        <>
                          <button type="button" className="admin-iconButton" onClick={() => moveEntry(selectedFavoritesCollection, entry.id, -1)} aria-label={`Move ${entry.title} earlier`}>
                            <AdminIcon name="chevronDown" size={14} className="is-rotatedUp" />
                          </button>
                          <button type="button" className="admin-iconButton" onClick={() => moveEntry(selectedFavoritesCollection, entry.id, 1)} aria-label={`Move ${entry.title} later`}>
                            <AdminIcon name="chevronDown" size={14} />
                          </button>
                        </>
                      ) : null}
                      <AdminButton tone="ghost" size="sm" onClick={() => navigate(`/admin/music/${entry.id}`)}>
                        Edit
                      </AdminButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {tab === 'drafts' ? (
          <div className="admin-pageGrid admin-pageGrid--two">
            <AdminPanel>
              <AdminSectionHeader title="Draft entries" description={`${draftCount} music entries still in draft state.`} />
              <div className="admin-list">
                {filteredEntries.filter((entry) => entry.status === 'draft').map((entry) => (
                  <Link key={entry.id} to={`/admin/music/${entry.id}`} className="admin-listRow">
                    <div className="admin-listRow__leading">
                      <div>
                        <strong>{entry.title || 'Untitled entry'}</strong>
                        <small>{entry.creator || entry.slug}</small>
                      </div>
                    </div>
                    <AdminStatusBadge status={entry.status} />
                  </Link>
                ))}
              </div>
            </AdminPanel>

            <AdminPanel>
              <AdminSectionHeader title="Draft collections" description={`${draftCollections.length} saved collection drafts.`} />
              <div className="admin-list">
                {draftCollections.length === 0 ? (
                  <p className="admin-muted">No collection drafts are waiting right now.</p>
                ) : (
                  draftCollections.map((collection) => (
                    <Link key={collection.id} to={`/admin/music/collections/${collection.id}`} className="admin-listRow">
                      <div className="admin-listRow__leading">
                        <div>
                          <strong>{collection.title || 'Untitled collection'}</strong>
                          <small>{collection.type.replace('_', ' ')}</small>
                        </div>
                      </div>
                      <AdminStatusBadge status={collection.status} />
                    </Link>
                  ))
                )}
              </div>
            </AdminPanel>
          </div>
        ) : null}
      </AdminPanel>

      <AdminDialog
        open={Boolean(confirm)}
        title={`${confirm?.type === 'delete' ? 'Delete' : confirm?.type === 'archive' ? 'Archive' : 'Duplicate'} selected music entries?`}
        description={
          workspace.sync.mode === 'firebase'
            ? 'This updates the live Firebase CMS and keeps a local fallback only if sync fails.'
            : 'This updates the private local workspace in this browser.'
        }
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
          {confirm?.ids?.length || 0} music entr{confirm?.ids?.length === 1 ? 'y' : 'ies'} will be updated.
        </p>
      </AdminDialog>
    </section>
  );
}
