import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ADMIN_MODULES } from '../adminRoutes.js';
import { useAdminToast } from '../context/AdminToastProvider.jsx';
import { useRegisterAdminPageActions } from '../context/AdminPageActionsContext.jsx';
import { useAdminWorkspace } from '../context/AdminWorkspaceProvider.jsx';
import { AdminBadge, AdminButton, AdminField, AdminInput, AdminPanel, AdminSectionHeader, AdminSelect, AdminStatusBadge, AdminTabs } from '../components/AdminPrimitives.jsx';
import AdminMediaField from '../components/AdminMediaField.jsx';
import { resolveCmsUploadCollectionName } from '../lib/adminMediaUploads.js';
import { classNames, fromInputDateTime, normalizeStringArray, slugify, toInputDateTime } from '../lib/adminUtils.js';
import { getEditorSections, getPreviewPath } from '../lib/moduleViews.js';
import { buildSlugIndex, validateDocument } from '../../lib/validation/cmsSchemas.js';

function convertArrayValue(value, type) {
  if (type === 'number') return value === '' ? '' : Number(value);
  if (type === 'boolean') return Boolean(value);
  if (type === 'list') return normalizeStringArray(value);
  if (type === 'datetime') return fromInputDateTime(value);
  return value;
}

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
  const common = {
    id: `field-${field.key}`,
    value:
      field.type === 'list'
        ? Array.isArray(value)
          ? value.join('\n')
          : ''
        : field.type === 'datetime'
          ? toInputDateTime(value)
          : field.type === 'boolean'
            ? undefined
            : value ?? '',
    onChange: (event) =>
      onChange(
        field.key,
        field.type === 'boolean'
          ? event.target.checked
          : convertArrayValue(event.target.value, field.type)
      ),
  };

  if (field.type === 'textarea') {
    return (
      <AdminField key={field.key} label={field.label} error={error}>
        <AdminInput multiline rows={field.rows || 5} {...common} />
      </AdminField>
    );
  }

  if (field.type === 'select') {
    return (
      <AdminField key={field.key} label={field.label} error={error}>
        <AdminSelect {...common}>
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

  if (field.type === 'boolean') {
    return (
      <AdminField key={field.key} label={field.label} error={error}>
        <label className="admin-check admin-check--pill">
          <input
            id={`field-${field.key}`}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(field.key, event.target.checked)}
          />
          <span>{Boolean(value) ? 'Enabled' : 'Disabled'}</span>
        </label>
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
        type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : field.type === 'datetime' ? 'datetime-local' : 'text'}
        {...common}
      />
    </AdminField>
  );
}

export default function AdminEditorPage({ moduleKey, mode = 'edit' }) {
  const { id } = useParams();
  const module = ADMIN_MODULES[moduleKey];
  const navigate = useNavigate();
  const workspace = useAdminWorkspace();
  const { pushToast } = useAdminToast();
  const previewTabs = [
    { label: 'Desktop', value: 'desktop' },
    { label: 'Tablet', value: 'tablet' },
    { label: 'Mobile', value: 'mobile' },
  ];

  const initialDocumentRef = useRef(
    mode === 'create' ? workspace.createDraft(moduleKey) : workspace.getDocument(moduleKey, id)
  );
  const [documentState, setDocumentState] = useState(initialDocumentRef.current);
  const [saveState, setSaveState] = useState('saved');
  const [previewViewport, setPreviewViewport] = useState('desktop');

  const sections = useMemo(() => getEditorSections(moduleKey, workspace), [moduleKey, workspace]);
  const collectionName = module.collection;
  const mediaAssets = workspace.getCollection('cms_media');
  const uploadCollectionName = resolveCmsUploadCollectionName(collectionName);

  useEffect(() => {
    if (mode === 'edit' && !documentState) {
      navigate(module.href, { replace: true });
    }
  }, [documentState, mode, module.href, navigate]);

  const validation = useMemo(
    () =>
      validateDocument(collectionName, documentState || {}, {
        collections: workspace.collections,
        slugIndex: buildSlugIndex(workspace.collections),
      }),
    [collectionName, documentState, workspace.collections]
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
      workspace.upsertDocument(moduleKey, documentState);
      setSaveState('saved');
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [documentState, moduleKey, workspace]);

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
    const result = workspace.upsertDocument(moduleKey, documentState, { notifySyncError: true });
    setSaveState('saved');
    pushToast({
      tone: result.ok ? 'success' : 'warning',
      title: result.ok ? `${module.singular} saved` : `${module.singular} saved with issues`,
      description: result.ok
        ? workspace.sync.mode === 'firebase'
          ? 'The latest changes were queued for Firebase CMS sync.'
          : 'The latest changes were saved to the local workspace.'
        : `${result.issues.length} validation issue${result.issues.length === 1 ? '' : 's'} still need attention.`,
    });
  }

  async function handlePublish() {
    if (!documentState) return;
    if (!validation.valid) {
      pushToast({
        tone: 'warning',
        title: 'Resolve validation issues before publishing',
        description: `${validation.issues.length} field issue${validation.issues.length === 1 ? '' : 's'} need attention.`,
      });
      return;
    }

    const next = {
      ...documentState,
      status: 'published',
      publishedAt: documentState.publishedAt || new Date().toISOString(),
    };
    setDocumentState(next);
    workspace.upsertDocument(moduleKey, next, { notifySyncError: true });
    pushToast({ tone: 'success', title: `${module.singular} marked as published` });
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

  const previewImage =
    resolveImageValue(documentState.coverImage, mediaAssets) ||
    resolveImageValue(documentState.mediaId, mediaAssets) ||
    resolveImageValue(documentState.avatarMediaId, mediaAssets);

  return (
    <section className="admin-page admin-editor">
      <AdminSectionHeader
        eyebrow={mode === 'create' ? `New ${module.singular}` : module.label}
        title={documentState.title || `Untitled ${module.singular}`}
        description={mode === 'create' ? `Create a new ${module.singular.toLowerCase()} draft in the private workspace.` : `Edit metadata, content, and publishing settings for this ${module.singular.toLowerCase()}.`}
        actions={
          <div className="admin-inlineActions">
            <AdminButton as={Link} to={module.href} tone="ghost">
              Back to {module.label}
            </AdminButton>
            <AdminBadge tone={validation.valid ? (isSyncing ? 'warning' : 'success') : 'warning'}>
              {isSyncing ? 'Saving…' : validation.valid ? savedLabel : `${validation.issues.length} issue${validation.issues.length === 1 ? '' : 's'}`}
            </AdminBadge>
            <AdminButton as={Link} to={getPreviewPath(moduleKey, documentState)} tone="ghost" icon="external">
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
          {sections.main.map((section) => (
            <AdminPanel key={section.title}>
              <AdminSectionHeader title={section.title} />
              <div className="admin-formGrid">
                {section.fields.map((field) =>
                  renderField(field, documentState[field.key], updateField, issuesByPath.get(field.key), {
                    uploadCollectionName,
                    uploadUsage: `${module.singular} · ${field.label}`,
                  })
                )}
              </div>
            </AdminPanel>
          ))}
        </div>

        <aside className="admin-editorSidebar">
          {sections.sidebar.map((section) => (
            <AdminPanel key={section.title}>
              <AdminSectionHeader title={section.title} />
              <div className="admin-formGrid">
                {section.fields.map((field) =>
                  renderField(field, documentState[field.key], updateField, issuesByPath.get(field.key), {
                    uploadCollectionName,
                    uploadUsage: `${module.singular} · ${field.label}`,
                  })
                )}
              </div>
            </AdminPanel>
          ))}

          <AdminPanel>
            <AdminSectionHeader title="Preview" description="Check summary density before opening the public route." />
            <AdminTabs items={previewTabs} value={previewViewport} onChange={setPreviewViewport} compact />
            <div className={classNames('admin-previewCard', `is-${previewViewport}`)}>
              {previewImage ? (
                <div className="admin-previewCard__image">
                  <img src={previewImage} alt={documentState.title || 'Preview image'} />
                </div>
              ) : null}
              <strong>{documentState.title || 'Untitled'}</strong>
              <p>{documentState.description || documentState.tagline || documentState.quote || documentState.summary || 'No summary written yet.'}</p>
              <div className="admin-previewCard__meta">
                <AdminStatusBadge status={documentState.status} />
                {documentState.visibility ? <AdminBadge tone="neutral">{documentState.visibility}</AdminBadge> : null}
              </div>
            </div>
          </AdminPanel>
        </aside>
      </div>
    </section>
  );
}
