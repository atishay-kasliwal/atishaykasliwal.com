import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CMS_COLLECTIONS, buildSlugIndex, validateDocument } from '../../lib/validation/cmsSchemas.js';
import { useAdminAuth } from '../auth/AdminAuthProvider.jsx';
import { ADMIN_MODULES } from '../adminRoutes.js';
import {
  createCommandItems,
  createContentBreakdown,
  createLiveCollections,
  createOverviewMetrics,
  createRecentActivity,
  createWorkspaceInsights,
} from '../lib/adminContent.js';
import { subscribeToCmsCollection, writeCmsDocument } from '../lib/adminFirestoreCms.js';
import { slugify } from '../lib/adminUtils.js';
import { useAdminToast } from './AdminToastProvider.jsx';

const STORAGE_KEY = 'ak-admin-workspace';
const AdminWorkspaceContext = createContext(null);

const INITIAL_SYNC_STATE = {
  loading: false,
  error: '',
  pendingWrites: 0,
  lastSyncedAt: null,
};

function readWorkspaceState() {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeWorkspaceState(state) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function mapDocumentsById(documents) {
  return Object.fromEntries((documents || []).map((document) => [document.id, document]));
}

function mergeCollections(baseCollections, overlayCollections, overlaySource = 'local') {
  const merged = {};

  Object.entries(baseCollections).forEach(([collectionName, documents]) => {
    const overlay = overlayCollections?.[collectionName] || {};
    const byId = new Map(documents.map((document) => [document.id, { ...document, _source: 'live' }]));

    Object.values(overlay).forEach((document) => {
      byId.set(document.id, { ...document, _source: overlaySource });
    });

    merged[collectionName] = [...byId.values()];
  });

  Object.entries(overlayCollections || {}).forEach(([collectionName, documents]) => {
    if (merged[collectionName]) return;
    merged[collectionName] = Object.values(documents).map((document) => ({
      ...document,
      _source: overlaySource,
    }));
  });

  return merged;
}

function filterLocalCollectionsForRemote(baseCollections, localCollections) {
  const filtered = {};

  Object.entries(localCollections || {}).forEach(([collectionName, documents]) => {
    const baseIds = new Set((baseCollections[collectionName] || []).map((document) => document.id));
    const retained = Object.values(documents).filter(
      (document) => document?._syncFailedAt || !baseIds.has(document.id)
    );

    if (retained.length > 0) {
      filtered[collectionName] = mapDocumentsById(retained);
    }
  });

  return filtered;
}

function upsertMappedDocument(current, collectionName, document) {
  return {
    ...current,
    [collectionName]: {
      ...(current[collectionName] || {}),
      [document.id]: document,
    },
  };
}

function removeMappedDocument(current, collectionName, id) {
  const existing = current[collectionName];
  if (!existing?.[id]) return current;

  const nextCollection = { ...existing };
  delete nextCollection[id];

  const next = { ...current };
  if (Object.keys(nextCollection).length === 0) {
    delete next[collectionName];
  } else {
    next[collectionName] = nextCollection;
  }

  return next;
}

function createBaseDocument(idPrefix, visibility = 'public') {
  return {
    id: `draft-${idPrefix}-${Date.now()}`,
    slug: '',
    title: '',
    status: 'draft',
    visibility,
    featured: false,
    seoTitle: '',
    seoDescription: '',
    coverImage: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createDefaultDocument(moduleKey) {
  const module = ADMIN_MODULES[moduleKey];
  const base = createBaseDocument(
    moduleKey,
    moduleKey === 'landing' || moduleKey === 'settings' ? 'private' : 'public'
  );

  switch (moduleKey) {
    case 'blogs':
      return {
        ...base,
        description: '',
        excerpt: '',
        category: 'Engineering',
        tags: [],
        contentMarkdown: '',
        canonicalUrl: '',
      };
    case 'projects':
      return {
        ...base,
        category: 'Product',
        tagline: '',
        timeline: '',
        role: '',
        href: '',
        demo: '',
        github: '',
        stack: [],
        metrics: [],
        problem: '',
        approach: '',
        architecture: [],
        decisions: [],
        challenges: [],
        lessons: [],
        writeupPostSlug: '',
      };
    case 'photos':
      return {
        ...base,
        mediaId: '',
        caption: '',
        alt: '',
        location: '',
        gallery: 'Art',
        width: null,
        height: null,
      };
    case 'testimonials':
      return {
        ...base,
        quote: '',
        personName: '',
        personRole: '',
        organization: '',
        avatarMediaId: '',
      };
    case 'journey':
      return {
        ...base,
        role: '',
        tag: '',
        date: '',
        summary: '',
      };
    case 'movies':
      return {
        ...base,
        creator: '',
        year: '',
        watchStatus: 'planned',
        notes: '',
      };
    case 'tv':
      return {
        ...base,
        creator: '',
        watchStatus: 'planned',
        seasons: '',
        notes: '',
      };
    case 'music':
      return {
        ...base,
        creator: '',
        kind: 'album',
        collectionIds: [],
        monthKey: '',
        notes: '',
      };
    default:
      return base;
  }
}

function createDefaultDocumentForCollection(collectionName) {
  switch (collectionName) {
    case 'cms_music_collections':
      return {
        ...createBaseDocument('music-collection'),
        type: 'monthly',
        description: '',
        entryIds: [],
        monthKey: '',
      };
    case 'cms_landing_config':
      return {
        ...createBaseDocument('landing', 'private'),
        heroProjectSlugs: [],
        highlightProjectSlugs: [],
        testimonialIds: [],
        journeyEntryIds: [],
      };
    case 'cms_site_settings':
      return {
        ...createBaseDocument('site-settings', 'private'),
        locale: 'en',
        timezone: 'America/New_York',
        adminTitle: 'Editorial workspace',
      };
    case 'cms_media':
      return {
        ...createBaseDocument('media'),
        kind: 'image',
        storagePath: 'cms/imported/',
        src: '',
        alt: '',
        usage: '',
      };
    default:
      return createBaseDocument(collectionName.replace(/^cms_/, ''));
  }
}

export function AdminWorkspaceProvider({ children }) {
  const auth = useAdminAuth();
  const { pushToast } = useAdminToast();
  const [localCollections, setLocalCollections] = useState(() => readWorkspaceState().collections || {});
  const [lastSavedAt, setLastSavedAt] = useState(() => readWorkspaceState().lastSavedAt || null);
  const [remoteCollections, setRemoteCollections] = useState({});
  const [remoteSync, setRemoteSync] = useState(INITIAL_SYNC_STATE);

  useEffect(() => {
    writeWorkspaceState({
      collections: localCollections,
      lastSavedAt,
    });
  }, [lastSavedAt, localCollections]);

  const liveCollections = useMemo(() => createLiveCollections(), []);
  const remoteEnabled = auth.authorized && !auth.configError;

  useEffect(() => {
    if (!remoteEnabled) {
      setRemoteCollections({});
      setRemoteSync(INITIAL_SYNC_STATE);
      return undefined;
    }

    let cancelled = false;
    let errorToastShown = false;
    const loadedCollections = new Set();

    setRemoteSync((current) => ({
      ...current,
      loading: true,
      error: '',
    }));

    const unsubscribers = CMS_COLLECTIONS.map((collectionName) =>
      subscribeToCmsCollection(
        collectionName,
        (documents) => {
          if (cancelled) return;

          loadedCollections.add(collectionName);
          setRemoteCollections((current) => ({
            ...current,
            [collectionName]: mapDocumentsById(documents),
          }));
          setRemoteSync((current) => ({
            ...current,
            loading: loadedCollections.size < CMS_COLLECTIONS.length,
            error: '',
            lastSyncedAt: new Date().toISOString(),
          }));
        },
        (error) => {
          if (cancelled) return;

          const description =
            error?.message || 'The workspace could not read the latest Firebase CMS data.';

          setRemoteSync((current) => ({
            ...current,
            loading: false,
            error: description,
          }));

          if (!errorToastShown) {
            errorToastShown = true;
            pushToast({
              tone: 'warning',
              title: 'Firebase sync is unavailable',
              description,
            });
          }
        }
      )
    );

    return () => {
      cancelled = true;
      unsubscribers.forEach((unsubscribe) => unsubscribe?.());
    };
  }, [pushToast, remoteEnabled]);

  const remoteBaseCollections = useMemo(
    () => (remoteEnabled ? mergeCollections(liveCollections, remoteCollections, 'remote') : liveCollections),
    [liveCollections, remoteCollections, remoteEnabled]
  );

  const remoteLocalCarryover = useMemo(
    () =>
      remoteEnabled
        ? filterLocalCollectionsForRemote(remoteBaseCollections, localCollections)
        : localCollections,
    [localCollections, remoteBaseCollections, remoteEnabled]
  );

  const collections = useMemo(
    () =>
      remoteEnabled
        ? mergeCollections(remoteBaseCollections, remoteLocalCarryover, 'local')
        : mergeCollections(liveCollections, localCollections, 'local'),
    [liveCollections, localCollections, remoteBaseCollections, remoteEnabled, remoteLocalCarryover]
  );

  const slugIndex = useMemo(() => buildSlugIndex(collections), [collections]);

  const value = useMemo(() => {
    const insights = createWorkspaceInsights(collections);
    const overviewMetrics = createOverviewMetrics(collections);
    const recentActivity = createRecentActivity(collections);
    const contentBreakdown = createContentBreakdown(collections);
    const commandItems = createCommandItems(collections);

    function persistLocalDocument(collectionName, document) {
      setLocalCollections((current) => upsertMappedDocument(current, collectionName, document));
      setLastSavedAt(document.updatedAt || new Date().toISOString());
    }

    function clearLocalDocument(collectionName, id) {
      setLocalCollections((current) => removeMappedDocument(current, collectionName, id));
    }

    function syncRemoteDocument(collectionName, document, options = {}) {
      setRemoteSync((current) => ({
        ...current,
        pendingWrites: current.pendingWrites + 1,
      }));

      writeCmsDocument(collectionName, document)
        .then(() => {
          clearLocalDocument(collectionName, document.id);
          setLastSavedAt(new Date().toISOString());
          setRemoteSync((current) => ({
            ...current,
            error: '',
            lastSyncedAt: new Date().toISOString(),
          }));
        })
        .catch((error) => {
          const fallbackDocument = {
            ...document,
            _syncFailedAt: new Date().toISOString(),
            _syncError: error?.message || 'The Firebase sync failed.',
          };

          persistLocalDocument(collectionName, fallbackDocument);
          setRemoteSync((current) => ({
            ...current,
            error: error?.message || 'The Firebase sync failed.',
          }));

          if (options.notifySyncError) {
            pushToast({
              tone: 'danger',
              title: 'Firebase sync failed',
              description:
                error?.message ||
                'Your latest edit was kept locally in this browser, but it did not reach Firestore.',
            });
          }
        })
        .finally(() => {
          setRemoteSync((current) => ({
            ...current,
            pendingWrites: Math.max(0, current.pendingWrites - 1),
          }));
        });
    }

    function persistDocument(collectionName, document, options = {}) {
      const stampedDocument = {
        ...document,
        updatedAt: new Date().toISOString(),
      };

      if (remoteEnabled) {
        syncRemoteDocument(collectionName, stampedDocument, options);
        return stampedDocument;
      }

      persistLocalDocument(collectionName, stampedDocument);
      return stampedDocument;
    }

    function upsertCollectionDocument(collectionName, document, options = {}) {
      const payload = {
        ...document,
        title: String(document.title || '').trim(),
        slug: document.slug || slugify(document.title || document.id),
      };

      const validation = validateDocument(collectionName, payload, {
        collections,
        slugIndex,
      });

      const persistedDocument = persistDocument(collectionName, payload, options);

      return {
        ok: validation.valid,
        issues: validation.issues,
        document: persistedDocument,
        syncMode: remoteEnabled ? 'firebase' : 'local',
      };
    }

    function upsertDocument(moduleKey, document, options = {}) {
      const module = ADMIN_MODULES[moduleKey];
      if (!module?.collection) return { ok: false, issues: [], document: null, syncMode: 'local' };
      return upsertCollectionDocument(module.collection, document, options);
    }

    function getCollection(collectionName) {
      return collections[collectionName] || [];
    }

    function getModuleCollection(moduleKey) {
      const module = ADMIN_MODULES[moduleKey];
      if (!module?.collection) return [];
      return getCollection(module.collection);
    }

    function getCollectionDocument(collectionName, id) {
      return getCollection(collectionName).find((item) => item.id === id || item.slug === id) || null;
    }

    function getDocument(moduleKey, id) {
      if (moduleKey === 'music') {
        return (
          collections.cms_music_entries.find((item) => item.id === id || item.slug === id) ||
          collections.cms_music_collections.find((item) => item.id === id || item.slug === id) ||
          null
        );
      }

      const module = ADMIN_MODULES[moduleKey];
      if (!module?.collection) return null;
      return (
        collections[module.collection].find((item) => item.id === id || item.slug === id) || null
      );
    }

    function duplicateCollectionDocument(collectionName, id, options = {}) {
      const source = getCollectionDocument(collectionName, id);
      if (!source) return null;

      const nextId = `${source.id}-copy-${Date.now()}`;
      const nextTitle = `${source.title} Copy`;
      const draft = {
        ...source,
        id: nextId,
        slug: slugify(nextTitle),
        title: nextTitle,
        status: 'draft',
        visibility: 'private',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return persistDocument(collectionName, draft, options);
    }

    function duplicateDocument(moduleKey, id, options = {}) {
      const module = ADMIN_MODULES[moduleKey];
      if (!module?.collection) return null;
      return duplicateCollectionDocument(module.collection, id, options);
    }

    function updateCollectionStatus(collectionName, ids, nextStatus, options = {}) {
      const idList = Array.isArray(ids) ? ids : [ids];

      idList.forEach((id) => {
        const document = getCollectionDocument(collectionName, id);
        if (!document) return;

        persistDocument(
          collectionName,
          {
            ...document,
            status: nextStatus,
            publishedAt:
              nextStatus === 'published'
                ? document.publishedAt || new Date().toISOString()
                : document.publishedAt || null,
          },
          options
        );
      });
    }

    function updateStatus(moduleKey, ids, nextStatus, options = {}) {
      const module = ADMIN_MODULES[moduleKey];
      if (!module?.collection) return;
      updateCollectionStatus(module.collection, ids, nextStatus, options);
    }

    function removeDocuments(moduleKey, ids, options = {}) {
      updateStatus(moduleKey, ids, 'deleted', options);
    }

    function archiveDocuments(moduleKey, ids, options = {}) {
      updateStatus(moduleKey, ids, 'archived', options);
    }

    function createCollectionDraft(collectionName, initialDocument = {}, options = {}) {
      const document = {
        ...createDefaultDocumentForCollection(collectionName),
        ...initialDocument,
      };
      return persistDocument(collectionName, document, options);
    }

    function createDraft(moduleKey, options = {}) {
      const document = createDefaultDocument(moduleKey);
      if (ADMIN_MODULES[moduleKey]?.collection) {
        return persistDocument(ADMIN_MODULES[moduleKey].collection, document, options);
      }
      return document;
    }

    return {
      collections,
      liveCollections,
      localCollections,
      lastSavedAt,
      insights,
      overviewMetrics,
      recentActivity,
      contentBreakdown,
      commandItems,
      sync: {
        mode: remoteEnabled ? 'firebase' : 'local',
        label: remoteEnabled ? 'Firebase CMS' : 'Local workspace',
        loading: remoteSync.loading,
        error: remoteSync.error,
        pendingWrites: remoteSync.pendingWrites,
        lastSyncedAt: remoteSync.lastSyncedAt,
      },
      getCollection,
      getModuleCollection,
      getCollectionDocument,
      getDocument,
      createCollectionDraft,
      createDraft,
      upsertCollectionDocument,
      upsertDocument,
      duplicateCollectionDocument,
      duplicateDocument,
      updateCollectionStatus,
      updateStatus,
      removeDocuments,
      archiveDocuments,
    };
  }, [
    collections,
    lastSavedAt,
    liveCollections,
    localCollections,
    pushToast,
    remoteEnabled,
    remoteSync.error,
    remoteSync.lastSyncedAt,
    remoteSync.loading,
    remoteSync.pendingWrites,
    slugIndex,
  ]);

  return <AdminWorkspaceContext.Provider value={value}>{children}</AdminWorkspaceContext.Provider>;
}

export function useAdminWorkspace() {
  const context = useContext(AdminWorkspaceContext);
  if (!context) {
    throw new Error('useAdminWorkspace must be used within AdminWorkspaceProvider.');
  }
  return context;
}
