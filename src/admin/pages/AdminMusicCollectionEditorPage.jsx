import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAdminToast } from '../context/AdminToastProvider.jsx';
import { useRegisterAdminPageActions } from '../context/AdminPageActionsContext.jsx';
import { useAdminWorkspace } from '../context/AdminWorkspaceProvider.jsx';
import { AdminBadge, AdminButton, AdminField, AdminInput, AdminPanel, AdminSectionHeader, AdminSelect, AdminStatusBadge, AdminTabs } from '../components/AdminPrimitives.jsx';
import AdminMediaField from '../components/AdminMediaField.jsx';
import { resolveCmsUploadCollectionName } from '../lib/adminMediaUploads.js';
import { classNames, normalizeStringArray, slugify } from '../lib/adminUtils.js';
import { buildSlugIndex, validateDocument } from '../../lib/validation/cmsSchemas.js';

function resolveImageValue(value, mediaAssets) {
  if (!value) return '';

  if (typeof value === 'string') {
    const asset = mediaAssets.find(
      (item) =>
        item.id === value ||
        item.slug === value ||
        item.src === value ||
        item.storagePath === value
    );
    return asset?.src || value;
  }

  if (typeof value === 'object') {
    return value.src || value.storagePath || value.mediaId || '';
  }

  return '';
}

function renderField(field, value, onChange, error, options = {}) {
  if (field.type === 'number') {
    return (
      <AdminField key={field.key} label={field.label} error={error}>
        <AdminInput
          type="number"
          value={value ?? ''}
          onChange={(event) => onChange(field.key, event.target.value === '' ? '' : Number(event.target.value))}
        />
      </AdminField>
    );
  }

  if (field.type === 'textarea') {
    return (
      <AdminField key={field.key} label={field.label} error={error}>
        <AdminInput
          multiline
          rows={field.rows || 4}
          value={value ?? ''}
          onChange={(event) => onChange(field.key, event.target.value)}
        />
      </AdminField>
    );
  }

  if (field.type === 'select') {
    return (
      <AdminField key={field.key} label={field.label} error={error}>
        <AdminSelect value={value ?? ''} onChange={(event) => onChange(field.key, event.target.value)}>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </AdminSelect>
      </AdminField>
    );
  }

  if (field.type === 'multiselect') {
    return (
      <AdminField key={field.key} label={field.label} error={error}>
        <div className="admin-multiselect">
          {field.options.map((option) => {
            const selected = Array.isArray(value) && value.includes(option.value);
            return (
              <label key={option.value} className="admin-check admin-check--pill">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(event) => {
                    const current = new Set(Array.isArray(value) ? value : []);
                    if (event.target.checked) current.add(option.value);
                    else current.delete(option.value);
                    onChange(field.key, [...current]);
                  }}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </AdminField>
    );
  }

  if (field.type === 'list') {
    return (
      <AdminField key={field.key} label={field.label} error={error}>
        <AdminInput
          multiline
          rows={field.rows || 5}
          value={Array.isArray(value) ? value.join('\n') : ''}
          onChange={(event) => onChange(field.key, normalizeStringArray(event.target.value))}
        />
      </AdminField>
    );
  }

  if (field.type === 'media') {
    return (
      <AdminMediaField
        key={field.key}
        field={field}
        value={value}
        onChange={onChange}
        error={error}
        uploadCollectionName={options.uploadCollectionName}
        uploadUsage={options.uploadUsage}
      />
    );
  }

  return (
    <AdminField key={field.key} label={field.label} error={error}>
      <AdminInput
        type="text"
        value={value ?? ''}
        onChange={(event) => onChange(field.key, event.target.value)}
      />
    </AdminField>
  );
}

export default function AdminMusicCollectionEditorPage({ mode = 'edit' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const workspace = useAdminWorkspace();
  const { pushToast } = useAdminToast();
  const previewTabs = [
    { label: 'Desktop', value: 'desktop' },
    { label: 'Tablet', value: 'tablet' },
    { label: 'Mobile', value: 'mobile' },
  ];

  const initialDocumentRef = useRef(
    mode === 'create'
      ? workspace.createCollectionDraft('cms_music_collections')
      : workspace.getCollectionDocument('cms_music_collections', id)
  );
  const [documentState, setDocumentState] = useState(initialDocumentRef.current);
  const [saveState, setSaveState] = useState('saved');
  const [previewViewport, setPreviewViewport] = useState('desktop');
  const [searchEntries, setSearchEntries] = useState('');
  const mediaAssets = workspace.getCollection('cms_media');
  const uploadCollectionName = resolveCmsUploadCollectionName('cms_music_collections');

  useEffect(() => {
    if (mode === 'edit' && !documentState) {
      navigate('/admin/music', { replace: true });
    }
  }, [documentState, mode, navigate]);

  const entryOptions = useMemo(() => {
    const entries = workspace.getCollection('cms_music_entries');
    return entries
      .filter((entry) => {
        if (!searchEntries) return true;
        return [entry.title, entry.creator, entry.slug]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(searchEntries.toLowerCase());
      })
      .map((entry) => ({
        label: entry.creator ? `${entry.title} · ${entry.creator}` : entry.title,
        value: entry.id,
      }));
  }, [searchEntries, workspace]);

  const validation = useMemo(
    () =>
      validateDocument('cms_music_collections', documentState || {}, {
        collections: workspace.collections,
        slugIndex: buildSlugIndex(workspace.collections),
      }),
    [documentState, workspace.collections]
  );

  const issuesByPath = useMemo(() => {
    const map = new Map();
    validation.issues.forEach((issue) => {
      if (!map.has(issue.path)) map.set(issue.path, issue.message);
    });
    return map;
  }, [validation.issues]);

  const isSyncing = saveState === 'saving' || workspace.sync.pendingWrites > 0;
  const savedLabel = workspace.sync.mode === 'firebase' ? 'Synced to Firebase' : 'Saved locally';

  useEffect(() => {
    if (!documentState) return undefined;
    setSaveState('saving');
    const timeout = window.setTimeout(() => {
      workspace.upsertCollectionDocument('cms_music_collections', documentState);
      setSaveState('saved');
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [documentState, workspace]);

  useEffect(() => {
    function handleBeforeUnload(event) {
      if (isSyncing) {
        event.preventDefault();
        event.returnValue = '';
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSyncing]);

  async function handleSave() {
    if (!documentState) return;
    const result = workspace.upsertCollectionDocument('cms_music_collections', documentState, {
      notifySyncError: true,
    });
    setSaveState('saved');
    pushToast({
      tone: result.ok ? 'success' : 'warning',
      title: result.ok ? 'Collection saved' : 'Collection saved with issues',
      description: result.ok
        ? workspace.sync.mode === 'firebase'
          ? 'The latest collection changes were queued for Firebase CMS sync.'
          : 'The latest collection changes were saved locally.'
        : `${result.issues.length} validation issue${result.issues.length === 1 ? '' : 's'} still need attention.`,
    });
  }

  async function handlePublish() {
    if (!documentState) return;
    if (!validation.valid) {
      pushToast({
        tone: 'warning',
        title: 'Resolve validation issues before publishing',
        description: `${validation.issues.length} field issue${validation.issues.length === 1 ? '' : 's'} still need attention.`,
      });
      return;
    }

    const next = {
      ...documentState,
      status: 'published',
      publishedAt: documentState.publishedAt || new Date().toISOString(),
    };

    setDocumentState(next);
    workspace.upsertCollectionDocument('cms_music_collections', next, {
      notifySyncError: true,
    });
    pushToast({ tone: 'success', title: 'Collection published' });
  }

  useRegisterAdminPageActions({
    hasUnsavedChanges: isSyncing,
    onSave: handleSave,
    onPublish: handlePublish,
  });

  function updateField(key, value) {
    setDocumentState((current) => {
      const next = {
        ...(current || {}),
        [key]: value,
      };

      if (key === 'title' && !String(next.slug || '').trim()) {
        next.slug = slugify(value);
      }

      return next;
    });
  }

  if (!documentState) return null;

  const previewImage = resolveImageValue(documentState.coverImage, mediaAssets);

  const sections = [
    {
      title: 'Basics',
      fields: [
        { key: 'title', label: 'Collection title', type: 'text' },
        { key: 'slug', label: 'Slug', type: 'text' },
        { key: 'type', label: 'Collection type', type: 'select', options: ['all_time', 'monthly', 'seasonal', 'custom'] },
        { key: 'monthKey', label: 'Month key', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea', rows: 4 },
        { key: 'coverImage', label: 'Collection artwork', type: 'media', mediaKind: 'image', placeholder: '/music/collection-cover.webp' },
      ],
    },
    {
      title: 'Entries',
      fields: [
        { key: 'entryIds', label: 'Assigned entries', type: 'multiselect', options: entryOptions },
      ],
    },
  ];

  return (
    <section className="admin-page admin-editor">
      <AdminSectionHeader
        eyebrow={mode === 'create' ? 'New music collection' : 'Music collection'}
        title={documentState.title || 'Untitled collection'}
        description="Define the collection type, assign entries, and manage the public ordering used by the music page."
        actions={
          <div className="admin-inlineActions">
            <AdminButton as={Link} to="/admin/music" tone="ghost">
              Back to Music
            </AdminButton>
            <AdminBadge tone={validation.valid ? (isSyncing ? 'warning' : 'success') : 'warning'}>
              {isSyncing ? 'Saving…' : validation.valid ? savedLabel : `${validation.issues.length} issue${validation.issues.length === 1 ? '' : 's'}`}
            </AdminBadge>
            <AdminButton as={Link} to="/about" tone="ghost" icon="external">
              Preview
            </AdminButton>
            <AdminButton tone="ghost" onClick={handleSave}>
              Save draft
            </AdminButton>
            <AdminButton tone="primary" onClick={handlePublish}>
              {documentState.status === 'published' ? 'Update' : 'Publish'}
            </AdminButton>
          </div>
        }
      />

      <div className="admin-editorLayout">
        <div className="admin-editorMain">
          {sections.map((section) => (
            <AdminPanel key={section.title}>
              <AdminSectionHeader title={section.title} />
              {section.title === 'Entries' ? (
                <div className="admin-stack">
                  <AdminField label="Find entries">
                    <AdminInput
                      type="text"
                      value={searchEntries}
                      onChange={(event) => setSearchEntries(event.target.value)}
                      placeholder="Search titles, artists, or slugs…"
                    />
                  </AdminField>
                  <div className="admin-formGrid">
                    {section.fields.map((field) =>
                      renderField(field, documentState[field.key], updateField, issuesByPath.get(field.key), {
                        uploadCollectionName,
                        uploadUsage: `Music collection · ${field.label}`,
                      })
                    )}
                  </div>
                </div>
              ) : (
                <div className="admin-formGrid">
                  {section.fields.map((field) =>
                    renderField(field, documentState[field.key], updateField, issuesByPath.get(field.key), {
                      uploadCollectionName,
                      uploadUsage: `Music collection · ${field.label}`,
                    })
                  )}
                </div>
              )}
            </AdminPanel>
          ))}
        </div>

        <aside className="admin-editorSidebar">
          <AdminPanel>
            <AdminSectionHeader title="Publishing" />
            <div className="admin-formGrid">
              {renderField(
                {
                  key: 'status',
                  label: 'Status',
                  type: 'select',
                  options: ['draft', 'published', 'unpublished', 'archived'],
                },
                documentState.status,
                updateField,
                issuesByPath.get('status')
              )}
              {renderField(
                {
                  key: 'visibility',
                  label: 'Visibility',
                  type: 'select',
                  options: ['private', 'public', 'unlisted'],
                },
                documentState.visibility,
                updateField,
                issuesByPath.get('visibility')
              )}
              {renderField(
                {
                  key: 'displayOrder',
                  label: 'Display order',
                  type: 'number',
                },
                documentState.displayOrder,
                updateField,
                issuesByPath.get('displayOrder')
              )}
            </div>
          </AdminPanel>

          <AdminPanel>
            <AdminSectionHeader title="Preview" description="Check the ranked layout before publishing." />
            <AdminTabs items={previewTabs} value={previewViewport} onChange={setPreviewViewport} compact />
            <div className={classNames('admin-previewCard', `is-${previewViewport}`)}>
              {previewImage ? (
                <div className="admin-previewCard__image">
                  <img src={previewImage} alt={documentState.title || 'Collection preview'} />
                </div>
              ) : null}
              <strong>{documentState.title || 'Untitled collection'}</strong>
              <p>{documentState.description || 'No collection description written yet.'}</p>
              <div className="admin-previewCard__meta">
                <AdminStatusBadge status={documentState.status} />
                <AdminBadge tone="neutral">{documentState.type.replace('_', ' ')}</AdminBadge>
                <AdminBadge tone="neutral">{documentState.entryIds?.length || 0} entries</AdminBadge>
              </div>
            </div>
          </AdminPanel>
        </aside>
      </div>
    </section>
  );
}
