import React, { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminToast } from '../context/AdminToastProvider.jsx';
import { useAdminWorkspace } from '../context/AdminWorkspaceProvider.jsx';
import { AdminBadge, AdminButton, AdminDialog, AdminEmptyState, AdminPanel, AdminSearchField, AdminSectionHeader, AdminStatusBadge, AdminTabs } from '../components/AdminPrimitives.jsx';
import AdminIcon from '../components/AdminIcon.jsx';
import {
  getAdminImageUploadAccept,
  toFriendlyMediaUploadError,
  uploadAdminMediaFile,
} from '../lib/adminMediaUploads.js';
import { formatAdminDate } from '../lib/adminUtils.js';

const SORT_OPTIONS = [
  { label: 'Title A-Z', value: 'title-asc' },
  { label: 'Type', value: 'kind-asc' },
  { label: 'Recently updated', value: 'updated-desc' },
];

function sortAssets(assets, value) {
  const [field, direction] = value.split('-');
  const factor = direction === 'desc' ? -1 : 1;

  return [...assets].sort((left, right) => {
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

    return String(a).localeCompare(String(b), undefined, { numeric: true }) * factor;
  });
}

export default function AdminMediaLibraryPage() {
  const navigate = useNavigate();
  const workspace = useAdminWorkspace();
  const { pushToast } = useAdminToast();
  const assets = workspace.getCollection('cms_media');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [usage, setUsage] = useState('all');
  const [sort, setSort] = useState('title-asc');
  const [view, setView] = useState('grid');
  const [selected, setSelected] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const usageOptions = useMemo(() => {
    const values = new Set(assets.map((asset) => asset.usage).filter(Boolean));
    return ['all', ...Array.from(values)];
  }, [assets]);

  const filteredAssets = useMemo(() => {
    const next = assets.filter((asset) => {
      const haystack = [asset.title, asset.usage, asset.src, asset.fileType, asset.alt]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (query && !haystack.includes(query.toLowerCase())) return false;
      if (kind !== 'all' && asset.kind !== kind) return false;
      if (usage !== 'all' && asset.usage !== usage) return false;

      return true;
    });

    return sortAssets(next, sort);
  }, [assets, kind, query, sort, usage]);

  const summary = useMemo(
    () => ({
      images: assets.filter((asset) => asset.kind === 'image').length,
      missingAlt: assets.filter((asset) => !asset.alt?.trim()).length,
      withDimensions: assets.filter((asset) => asset.width && asset.height).length,
      activeUses: new Set(assets.map((asset) => asset.usage).filter(Boolean)).size,
    }),
    [assets]
  );

  function toggleSelected(id) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function copyUrl(src) {
    if (!src || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      pushToast({ tone: 'warning', title: 'Clipboard is not available in this browser.' });
      return;
    }

    navigator.clipboard.writeText(src);
    pushToast({ tone: 'success', title: 'Asset URL copied' });
  }

  function applyConfirmedAction() {
    if (!confirm) return;

    if (confirm.type === 'archive') {
      workspace.updateCollectionStatus('cms_media', confirm.ids, 'archived', {
        notifySyncError: true,
      });
      pushToast({ tone: 'success', title: `${confirm.ids.length} assets archived` });
    }

    if (confirm.type === 'delete') {
      workspace.updateCollectionStatus('cms_media', confirm.ids, 'deleted', {
        notifySyncError: true,
      });
      pushToast({ tone: 'success', title: `${confirm.ids.length} assets moved to deleted` });
    }

    setSelected([]);
    setConfirm(null);
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const uploadedAsset = await uploadAdminMediaFile({
        file,
        storageCollection: 'media',
        usage: 'Media library upload',
      });

      const result = workspace.upsertCollectionDocument('cms_media', uploadedAsset, {
        notifySyncError: true,
      });

      setQuery('');
      setKind('all');
      setUsage('all');
      setSort('updated-desc');

      pushToast({
        tone: result.ok ? 'success' : 'warning',
        title: 'Image uploaded',
        description: result.ok
          ? `${uploadedAsset.title} was added to the media library.`
          : `${uploadedAsset.title} uploaded, but its metadata still needs review.`,
      });
    } catch (uploadError) {
      pushToast({
        tone: 'danger',
        title: 'Upload failed',
        description: toFriendlyMediaUploadError(uploadError),
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }

  return (
    <section className="admin-page">
      <input
        ref={fileInputRef}
        type="file"
        accept={getAdminImageUploadAccept()}
        hidden
        onChange={handleUpload}
      />

      <AdminSectionHeader
        eyebrow="System"
        title="Media Library"
        description="Review imported public assets, upload new images, clean up metadata, and trace where each file is currently used across the site."
        actions={
          <div className="admin-inlineActions">
            <AdminButton
              tone="ghost"
              size="sm"
              icon="plus"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? 'Uploading…' : 'Upload image'}
            </AdminButton>
            <AdminTabs
              compact
              items={[
                { label: 'Grid', value: 'grid' },
                { label: 'List', value: 'list' },
              ]}
              value={view}
              onChange={setView}
            />
          </div>
        }
      />

      <div className="admin-metricGrid admin-metricGrid--compact">
        <AdminPanel className="admin-metricCard">
          <span className="admin-metricCard__label">Assets</span>
          <strong className="admin-metricCard__value">{assets.length}</strong>
        </AdminPanel>
        <AdminPanel className="admin-metricCard">
          <span className="admin-metricCard__label">Images</span>
          <strong className="admin-metricCard__value">{summary.images}</strong>
        </AdminPanel>
        <AdminPanel className="admin-metricCard">
          <span className="admin-metricCard__label">Measured assets</span>
          <strong className="admin-metricCard__value">{summary.withDimensions}</strong>
        </AdminPanel>
        <AdminPanel className="admin-metricCard">
          <span className="admin-metricCard__label">Missing alt text</span>
          <strong className="admin-metricCard__value">{summary.missingAlt}</strong>
        </AdminPanel>
      </div>

      <AdminPanel>
        <div className="admin-toolbar">
          <AdminSearchField
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search assets, usage, file types, and alt text…"
          />
          <div className="admin-toolbar__filters">
            <select className="admin-select admin-select--inline" value={kind} onChange={(event) => setKind(event.target.value)}>
              <option value="all">All asset types</option>
              <option value="image">Images</option>
              <option value="video">Video</option>
              <option value="document">Documents</option>
              <option value="audio">Audio</option>
            </select>
            <select className="admin-select admin-select--inline" value={usage} onChange={(event) => setUsage(event.target.value)}>
              {usageOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All usage states' : option}
                </option>
              ))}
            </select>
            <select className="admin-select admin-select--inline" value={sort} onChange={(event) => setSort(event.target.value)}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-toolbar admin-toolbar--meta">
          <div className="admin-toolbar__meta">
            <strong>{filteredAssets.length}</strong>
            <span>assets in view</span>
            <AdminBadge tone="neutral">JPG, PNG, WEBP, GIF</AdminBadge>
            <AdminBadge tone="neutral">25 MB max</AdminBadge>
          </div>
          {selected.length > 0 ? (
            <div className="admin-inlineActions">
              <AdminBadge tone="neutral">{selected.length} selected</AdminBadge>
              <AdminButton tone="ghost" size="sm" onClick={() => setConfirm({ type: 'archive', ids: selected })}>
                Archive
              </AdminButton>
              <AdminButton tone="danger" size="sm" onClick={() => setConfirm({ type: 'delete', ids: selected })}>
                Delete
              </AdminButton>
            </div>
          ) : null}
        </div>

        {filteredAssets.length === 0 ? (
          <AdminEmptyState
            icon="image"
            title="No assets match the current filters"
            description="Try broadening the search or switching to a different asset type."
          />
        ) : view === 'grid' ? (
          <div className="admin-cardGrid admin-cardGrid--media">
            {filteredAssets.map((asset) => (
              <article key={asset.id} className="admin-entityCard admin-entityCard--media">
                <label className="admin-entityCard__checkbox">
                  <input
                    type="checkbox"
                    checked={selected.includes(asset.id)}
                    onChange={() => toggleSelected(asset.id)}
                    aria-label={`Select ${asset.title}`}
                  />
                </label>
                <div className="admin-entityCard__media">
                  {asset.src ? (
                    <img src={asset.src} alt={asset.alt || asset.title} />
                  ) : (
                    <span className="admin-entityCard__mediaFallback">
                      <AdminIcon name="image" size={18} />
                    </span>
                  )}
                </div>
                <div className="admin-entityCard__body">
                  <div className="admin-entityCard__meta">
                    <AdminStatusBadge status={asset.status} />
                    <AdminBadge tone="neutral">{asset.fileType || asset.kind}</AdminBadge>
                  </div>
                  <strong>{asset.title}</strong>
                  <p>{asset.usage || 'Imported asset'}</p>
                  <small>{asset.width && asset.height ? `${asset.width} × ${asset.height}` : 'Dimensions unavailable'}</small>
                </div>
                <div className="admin-entityCard__actions">
                  <AdminButton tone="ghost" size="sm" onClick={() => navigate(`/admin/media/${asset.id}`)}>
                    Edit
                  </AdminButton>
                  <AdminButton tone="ghost" size="sm" onClick={() => copyUrl(asset.src)}>
                    Copy URL
                  </AdminButton>
                  <AdminButton as={Link} tone="ghost" size="sm" to={asset.src}>
                    Open
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
                      checked={selected.length > 0 && selected.length === filteredAssets.length}
                      onChange={(event) => setSelected(event.target.checked ? filteredAssets.map((asset) => asset.id) : [])}
                      aria-label="Select all assets in view"
                    />
                  </th>
                  <th>Asset</th>
                  <th>Usage</th>
                  <th>Type</th>
                  <th>Dimensions</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => (
                  <tr key={asset.id}>
                    <td data-label="Select">
                      <input
                        type="checkbox"
                        checked={selected.includes(asset.id)}
                        onChange={() => toggleSelected(asset.id)}
                        aria-label={`Select ${asset.title}`}
                      />
                    </td>
                    <td data-label="Asset">
                      <div className="admin-table__titleCell">
                        <button type="button" className="admin-table__titleButton" onClick={() => navigate(`/admin/media/${asset.id}`)}>
                          {asset.title}
                        </button>
                        <small>{asset.storagePath}</small>
                      </div>
                    </td>
                    <td data-label="Usage">{asset.usage || 'Imported asset'}</td>
                    <td data-label="Type">
                      <div className="admin-inlineActions">
                        <AdminBadge tone="neutral">{asset.kind}</AdminBadge>
                        <AdminBadge tone="neutral">{asset.fileType || '—'}</AdminBadge>
                      </div>
                    </td>
                    <td data-label="Dimensions">
                      {asset.width && asset.height ? `${asset.width} × ${asset.height}` : '—'}
                    </td>
                    <td data-label="Updated">{formatAdminDate(asset.updatedAt || asset.publishedAt || asset.createdAt)}</td>
                    <td data-label="Actions">
                      <div className="admin-rowActions">
                        <button type="button" className="admin-iconButton" onClick={() => navigate(`/admin/media/${asset.id}`)} aria-label={`Edit ${asset.title}`}>
                          <AdminIcon name="edit" size={15} />
                        </button>
                        <button type="button" className="admin-iconButton" onClick={() => copyUrl(asset.src)} aria-label={`Copy URL for ${asset.title}`}>
                          <AdminIcon name="copy" size={15} />
                        </button>
                        <Link className="admin-iconButton" to={asset.src} aria-label={`Open ${asset.title}`}>
                          <AdminIcon name="external" size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>

      <AdminDialog
        open={Boolean(confirm)}
        title={`${confirm?.type === 'delete' ? 'Delete' : 'Archive'} selected assets?`}
        description={
          workspace.sync.mode === 'firebase'
            ? 'This updates the live Firebase CMS and keeps a local fallback only if sync fails.'
            : 'This only changes the local administrative workspace in this browser.'
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
          {confirm?.ids?.length || 0} assets will be updated in {workspace.sync.mode === 'firebase' ? 'Firebase CMS' : 'the local workspace state'}.
        </p>
      </AdminDialog>
    </section>
  );
}
