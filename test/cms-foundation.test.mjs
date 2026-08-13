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
