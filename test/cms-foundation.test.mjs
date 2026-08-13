import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let viteServer;

async function loadModule(modulePath) {
  return viteServer.ssrLoadModule(modulePath);
}

before(async () => {
  viteServer = await createServer({
    root: ROOT,
    logLevel: 'error',
    appType: 'custom',
    server: {
      middlewareMode: true,
      hmr: false,
    },
  });
});

after(async () => {
  await viteServer.close();
});

test('protected admin routing handles signed-out, unauthorized, authorized, and loading states', async () => {
  const { resolveAdminRouteDecision } = await loadModule('/src/lib/firebase/admin.js');

  const signedOut = resolveAdminRouteDecision(
    {
      loading: false,
      configError: '',
      user: null,
      authorized: false,
      reason: '',
    },
    { pathname: '/admin/projects/new', search: '', hash: '' }
  );
  assert.equal(signedOut.status, 'signed_out');
  assert.equal(
    signedOut.redirectTo,
    '/admin/sign-in?next=%2Fadmin%2Fprojects%2Fnew'
  );

  const unauthorized = resolveAdminRouteDecision(
    {
      loading: false,
      configError: '',
      user: { uid: '123' },
      authorized: false,
      reason: 'missing_admin_claim',
    },
    { pathname: '/admin/projects/abc', search: '?tab=details', hash: '#focus' }
  );
  assert.equal(unauthorized.status, 'unauthorized');
  assert.equal(
    unauthorized.redirectTo,
    '/admin/unauthorized?next=%2Fadmin%2Fprojects%2Fabc%3Ftab%3Ddetails%23focus&reason=missing_admin_claim'
  );

  const authorized = resolveAdminRouteDecision(
    {
      loading: false,
      configError: '',
      user: { uid: '123' },
      authorized: true,
      reason: '',
    },
    { pathname: '/admin/media', search: '', hash: '' }
  );
  assert.equal(authorized.status, 'authorized');
  assert.equal(authorized.redirectTo, null);

  const loading = resolveAdminRouteDecision(
    {
      loading: true,
      configError: '',
      user: null,
      authorized: false,
      reason: '',
    },
    { pathname: '/admin', search: '', hash: '' }
  );
  assert.equal(loading.status, 'loading');
  assert.equal(loading.redirectTo, null);
});

test('cloudflare spa fallbacks use the root shell for admin and highlights routes', async () => {
  const redirects = await fs.readFile(path.join(ROOT, 'public', '_redirects'), 'utf-8');

  assert.match(redirects, /^\/admin\s+\/\s+200$/m);
  assert.match(redirects, /^\/admin\/\*\s+\/\s+200$/m);
  assert.match(redirects, /^\/highlights\/\*\s+\/\s+200$/m);
  assert.match(redirects, /^\/Highlights\/\*\s+\/\s+200$/m);
  assert.doesNotMatch(redirects, /^\/admin(?:\/\*)?\s+\/index\.html\s+200$/m);
});

test('admin pages function serves an admin-specific boot shell', async () => {
  const { buildAdminBootPayload } = await import(
    pathToFileURL(path.join(ROOT, 'functions', 'admin', '_shared.js')).href
  );

  const signIn = buildAdminBootPayload('/admin');
  assert.match(signIn.title, /Admin Sign-In/);
  assert.match(signIn.shell, /Opening the editorial workspace/);

  const workspace = buildAdminBootPayload('/admin/settings');
  assert.match(workspace.title, /Admin Workspace/);
  assert.match(workspace.shell, /Loading the admin workspace/);
});

test('cms validation enforces content state, slug format, and landing slot uniqueness', async () => {
  const { validateDocument, validateStateTransition } = await loadModule(
    '/src/lib/validation/cmsSchemas.js'
  );

  assert.equal(validateStateTransition('draft', 'published'), true);
  assert.equal(validateStateTransition('published', 'draft'), false);

  const invalidSlug = validateDocument('cms_posts', {
    id: 'post-1',
    slug: 'Bad Slug',
    title: 'Post',
    status: 'draft',
    visibility: 'public',
    contentMarkdown: '# Post',
  });
  assert.equal(invalidSlug.valid, false);
  assert.equal(
    invalidSlug.issues.some((issue) => issue.path === 'slug'),
    true
  );

  const duplicateLanding = validateDocument('cms_landing_config', {
    id: 'home',
    slug: 'home',
    title: 'Homepage',
    status: 'draft',
    visibility: 'private',
    heroProjectSlugs: ['atriveo', 'atriveo'],
  });
  assert.equal(duplicateLanding.valid, false);
  assert.equal(
    duplicateLanding.issues.some((issue) =>
      issue.message.includes('duplicate exclusive slot assignments')
    ),
    true
  );

  const mediaBackedProject = validateDocument(
    'cms_projects',
    {
      id: 'project-1',
      slug: 'project-1',
      title: 'Project 1',
      status: 'draft',
      visibility: 'public',
      category: 'Tooling',
      coverImage: '/covers/project-1.webp',
    },
    {
      collections: {
        cms_media: [
          {
            id: 'asset-1',
            slug: 'asset-1',
            src: '/covers/project-1.webp',
            storagePath: 'cms/imported/project-1.webp',
          },
        ],
      },
    }
  );
  assert.equal(mediaBackedProject.valid, true);
});

test('admin media upload helpers build cms-safe asset metadata', async () => {
  const {
    buildUploadedMediaDocument,
    createUploadedMediaTitle,
    resolveCmsUploadCollectionName,
  } = await loadModule('/src/admin/lib/adminMediaUploads.js');

  assert.equal(createUploadedMediaTitle('hero-cover_final.webp'), 'hero cover final');
  assert.equal(resolveCmsUploadCollectionName('cms_music_entries'), 'music');
  assert.equal(resolveCmsUploadCollectionName('cms_projects'), 'projects');

  const asset = buildUploadedMediaDocument({
    file: {
      name: 'hero-cover_final.webp',
      type: 'image/webp',
      size: 24567,
    },
    downloadUrl: 'https://example.com/hero-cover.webp',
    storagePath: 'cms/projects/2026/08/hero-cover-final.webp',
    now: new Date('2026-08-13T12:00:00.000Z'),
    usage: 'Project · Cover image',
    width: 1600,
    height: 900,
    id: 'media-hero-cover-final',
    slug: 'hero-cover-final',
  });

  assert.deepEqual(
    {
      id: asset.id,
      slug: asset.slug,
      title: asset.title,
      kind: asset.kind,
      fileType: asset.fileType,
      sizeBytes: asset.sizeBytes,
      width: asset.width,
      height: asset.height,
      storagePath: asset.storagePath,
      src: asset.src,
      status: asset.status,
      visibility: asset.visibility,
    },
    {
      id: 'media-hero-cover-final',
      slug: 'hero-cover-final',
      title: 'hero cover final',
      kind: 'image',
      fileType: 'WEBP',
      sizeBytes: 24567,
      width: 1600,
      height: 900,
      storagePath: 'cms/projects/2026/08/hero-cover-final.webp',
      src: 'https://example.com/hero-cover.webp',
      status: 'published',
      visibility: 'public',
    }
  );
});

test('admin firestore cms helpers serialize timestamps and strip local metadata', async () => {
  const { deserializeCmsDocument, serializeCmsDocument } = await loadModule(
    '/src/admin/lib/adminFirestoreCms.js'
  );

  const serialized = serializeCmsDocument({
    id: 'project-1',
    title: 'Project 1',
    status: 'draft',
    visibility: 'public',
    createdAt: '2026-08-13T12:00:00.000Z',
    updatedAt: '2026-08-13T13:00:00.000Z',
    displayOrder: '',
    year: '2026',
    _syncFailedAt: '2026-08-13T14:00:00.000Z',
  });

  assert.equal(serialized.id, 'project-1');
  assert.equal(serialized.title, 'Project 1');
  assert.equal(serialized.displayOrder, undefined);
  assert.equal(serialized.year, 2026);
  assert.equal('_syncFailedAt' in serialized, false);
  assert.equal(typeof serialized.createdAt?.toDate, 'function');
  assert.equal(typeof serialized.updatedAt?.toDate, 'function');

  const deserialized = deserializeCmsDocument('project-1', {
    ...serialized,
    publishedAt: {
      toDate() {
        return new Date('2026-08-13T15:00:00.000Z');
      },
    },
  });

  assert.equal(deserialized.id, 'project-1');
  assert.equal(deserialized.createdAt, '2026-08-13T12:00:00.000Z');
  assert.equal(deserialized.updatedAt, '2026-08-13T13:00:00.000Z');
  assert.equal(deserialized.publishedAt, '2026-08-13T15:00:00.000Z');
});

test('legacy content adapters preserve testimonials, collections, and media-backed metadata', async () => {
  const {
    getLegacyMusicCollections,
    getLegacyMusicEntries,
    getLegacyProjectCollections,
    getLegacyTestimonials,
  } = await loadModule('/src/lib/content/legacyAdapters.js');

  const testimonials = getLegacyTestimonials();
  assert.equal(testimonials[0].id, 'da-ma');
  assert.equal(Boolean(testimonials[0].avatar), true);

  const collections = getLegacyProjectCollections();
  assert.equal(collections[0].title, 'Currently building');
  assert.equal(collections[0].projects.length, 2);

  const musicEntries = getLegacyMusicEntries();
  const musicCollections = getLegacyMusicCollections();
  assert.equal(musicCollections[0].entryIds.length, musicEntries.length);
});

test('central public content service returns legacy-backed content consistently', async () => {
  const {
    getLandingTestimonials,
    getLatestPosts,
    getPostBySlug,
    getProjectBySlug,
    getProjects,
  } = await loadModule('/src/lib/content/publicContent.js');

  assert.equal(getProjects().length >= 5, true);
  assert.equal(getProjectBySlug('atriveo').writeup, 'atriveo-capture-before-analytics');
  assert.equal(getPostBySlug('point-in-time-correctness').slug, 'point-in-time-correctness');
  assert.equal(getLandingTestimonials().length, 6);

  const latest = getLatestPosts(2);
  assert.equal(latest.length, 2);
  assert.equal(new Date(latest[0].date) >= new Date(latest[1].date), true);
});

test('existing public routes still render through the SSR entry', async () => {
  const { render } = await loadModule('/src/entry-server.jsx');

  const home = await render('/');
  assert.equal(home.errors.length, 0);
  assert.match(home.html, /Atishay/i);

  const blog = await render('/blog');
  assert.equal(blog.errors.length, 0);
  assert.match(blog.html, /Latest notes/i);

  const project = await render('/projects/atriveo');
  assert.equal(project.errors.length, 0);
  assert.match(project.html, /Atriveo/i);
});

test('admin metadata and command indexing cover music collection workflows', async () => {
  const { getAdminPageMeta } = await loadModule('/src/admin/adminRoutes.js');
  const { createCommandItems, createLiveCollections } = await loadModule(
    '/src/admin/lib/adminContent.js'
  );

  const newCollectionMeta = getAdminPageMeta('/admin/music/collections/new');
  assert.equal(newCollectionMeta.title, 'New Music Collection');

  const editCollectionMeta = getAdminPageMeta('/admin/music/collections/all-time-favorites');
  assert.equal(editCollectionMeta.title, 'Edit Music Collection');

  const collections = createLiveCollections();
  const commandItems = createCommandItems(collections);

  assert.equal(
    commandItems.some((item) => item.href?.startsWith('/admin/music/collections/')),
    true
  );
  assert.equal(
    commandItems.some((item) => item.href === '/admin/music/new'),
    true
  );
});
