import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminToast } from '../context/AdminToastProvider.jsx';
import { useRegisterAdminPageActions } from '../context/AdminPageActionsContext.jsx';
import { useAdminWorkspace } from '../context/AdminWorkspaceProvider.jsx';
import { AdminBadge, AdminButton, AdminPanel, AdminSectionHeader, AdminStatusBadge } from '../components/AdminPrimitives.jsx';
import { buildSlugIndex, LANDING_SLOT_LIMITS, validateDocument } from '../../lib/validation/cmsSchemas.js';

function LandingSlotPanel({
  title,
  description,
  items,
  selectedIds,
  onToggle,
  limit,
  issue,
  renderMeta,
}) {
  return (
    <AdminPanel>
      <AdminSectionHeader
        title={title}
        description={description}
        actions={<AdminBadge tone="neutral">{selectedIds.length} / {limit}</AdminBadge>}
      />
      <div className="admin-optionGrid">
        {items.map((item) => {
          const selected = selectedIds.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              className={`admin-optionCard${selected ? ' is-selected' : ''}`}
              onClick={() => onToggle(item.id)}
            >
              <div className="admin-optionCard__header">
                <strong>{item.title}</strong>
                {item.status ? <AdminStatusBadge status={item.status} /> : null}
              </div>
              <p>{item.summary || item.tagline || item.quote || item.role || 'No summary available yet.'}</p>
              <small>{renderMeta(item)}</small>
            </button>
          );
        })}
      </div>
      {issue ? <p className="admin-field__error">{issue}</p> : null}
    </AdminPanel>
  );
}

export default function AdminLandingPage() {
  const workspace = useAdminWorkspace();
  const { pushToast } = useAdminToast();
  const landingDocument = workspace.getCollection('cms_landing_config')[0] || null;
  const projects = workspace.getCollection('cms_projects');
  const testimonials = workspace.getCollection('cms_testimonials');
  const journeyEntries = workspace.getCollection('cms_journey_entries');

  const [documentState, setDocumentState] = useState(landingDocument);
  const [saveState, setSaveState] = useState('saved');

  useEffect(() => {
    setDocumentState(landingDocument);
  }, [landingDocument]);

  const validation = useMemo(
    () =>
      validateDocument('cms_landing_config', documentState || {}, {
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
      workspace.upsertCollectionDocument('cms_landing_config', documentState);
      setSaveState('saved');
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [documentState, workspace]);

  async function handleSave() {
    if (!documentState) return;
    const result = workspace.upsertCollectionDocument('cms_landing_config', documentState, {
      notifySyncError: true,
    });
    setSaveState('saved');
    pushToast({
      tone: result.ok ? 'success' : 'warning',
      title: result.ok ? 'Homepage curation saved' : 'Homepage curation saved with issues',
      description: result.ok
        ? workspace.sync.mode === 'firebase'
          ? 'The latest slot assignments were queued for Firebase CMS sync.'
          : 'The latest slot assignments were saved locally.'
        : `${result.issues.length} validation issue${result.issues.length === 1 ? '' : 's'} still need review.`,
    });
  }

  async function handlePublish() {
    if (!documentState) return;
    if (!validation.valid) {
      pushToast({
        tone: 'warning',
        title: 'Resolve slot issues before publishing',
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
    workspace.upsertCollectionDocument('cms_landing_config', next, {
      notifySyncError: true,
    });
    pushToast({ tone: 'success', title: 'Homepage curation published' });
  }

  useRegisterAdminPageActions({
    hasUnsavedChanges: isSyncing,
    onSave: handleSave,
    onPublish: handlePublish,
  });

  function toggleSelection(field, value) {
    const limit = LANDING_SLOT_LIMITS[field];
    setDocumentState((current) => {
      const selected = new Set(current?.[field] || []);
      if (selected.has(value)) {
        selected.delete(value);
        return { ...current, [field]: [...selected] };
      }

      if (selected.size >= limit) {
        pushToast({
          tone: 'warning',
          title: `Only ${limit} ${limit === 1 ? 'item is' : 'items are'} allowed here`,
          description: 'Remove an existing assignment before adding another item.',
        });
        return current;
      }

      selected.add(value);
      return { ...current, [field]: [...selected] };
    });
  }

  if (!documentState) return null;

  return (
    <section className="admin-page">
      <AdminSectionHeader
        eyebrow="Homepage"
        title="Landing curation"
        description="Choose which live records fill the fixed homepage slots without changing the public layout or grid structure."
        actions={
          <div className="admin-inlineActions">
            <AdminBadge tone={validation.valid ? (isSyncing ? 'warning' : 'success') : 'warning'}>
              {isSyncing ? 'Saving…' : validation.valid ? savedLabel : `${validation.issues.length} issue${validation.issues.length === 1 ? '' : 's'}`}
            </AdminBadge>
            <AdminButton as={Link} to="/" tone="ghost" icon="external">
              Preview homepage
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

      <div className="admin-metricGrid admin-metricGrid--compact">
        <AdminPanel className="admin-metricCard">
          <span className="admin-metricCard__label">Hero projects</span>
          <strong className="admin-metricCard__value">{documentState.heroProjectSlugs?.length || 0}</strong>
        </AdminPanel>
        <AdminPanel className="admin-metricCard">
          <span className="admin-metricCard__label">Highlights</span>
          <strong className="admin-metricCard__value">{documentState.highlightProjectSlugs?.length || 0}</strong>
        </AdminPanel>
        <AdminPanel className="admin-metricCard">
          <span className="admin-metricCard__label">Testimonials</span>
          <strong className="admin-metricCard__value">{documentState.testimonialIds?.length || 0}</strong>
        </AdminPanel>
        <AdminPanel className="admin-metricCard">
          <span className="admin-metricCard__label">Journey entries</span>
          <strong className="admin-metricCard__value">{documentState.journeyEntryIds?.length || 0}</strong>
        </AdminPanel>
      </div>

      <div className="admin-stack">
        <LandingSlotPanel
          title="Hero projects"
          description="These projects drive the first editorial impression of the homepage."
          items={projects}
          selectedIds={documentState.heroProjectSlugs || []}
          onToggle={(id) => toggleSelection('heroProjectSlugs', id)}
          limit={LANDING_SLOT_LIMITS.heroProjectSlugs}
          issue={issuesByPath.get('heroProjectSlugs')}
          renderMeta={(item) => item.category || item.role || item.slug}
        />

        <LandingSlotPanel
          title="Featured highlights"
          description="These are the cards shown in the fixed highlights section near the end of the landing page."
          items={projects}
          selectedIds={documentState.highlightProjectSlugs || []}
          onToggle={(id) => toggleSelection('highlightProjectSlugs', id)}
          limit={LANDING_SLOT_LIMITS.highlightProjectSlugs}
          issue={issuesByPath.get('highlightProjectSlugs')}
          renderMeta={(item) => item.category || item.timeline || item.slug}
        />

        <LandingSlotPanel
          title="Testimonials"
          description="Pick the quotes you want to surface in the current testimonial layout."
          items={testimonials.map((item) => ({
            ...item,
            summary: item.quote,
          }))}
          selectedIds={documentState.testimonialIds || []}
          onToggle={(id) => toggleSelection('testimonialIds', id)}
          limit={LANDING_SLOT_LIMITS.testimonialIds}
          issue={issuesByPath.get('testimonialIds')}
          renderMeta={(item) => [item.personRole, item.organization].filter(Boolean).join(' · ') || item.slug}
        />

        <LandingSlotPanel
          title="Journey"
          description="Control which milestones remain visible in the current homepage timeline section."
          items={journeyEntries}
          selectedIds={documentState.journeyEntryIds || []}
          onToggle={(id) => toggleSelection('journeyEntryIds', id)}
          limit={LANDING_SLOT_LIMITS.journeyEntryIds}
          issue={issuesByPath.get('journeyEntryIds')}
          renderMeta={(item) => item.date || item.tag || item.slug}
        />
      </div>
    </section>
  );
}
