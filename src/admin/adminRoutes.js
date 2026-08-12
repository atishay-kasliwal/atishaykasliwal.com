export const ADMIN_NAV_ITEMS = [
  { key: 'overview', href: '/admin', label: 'Overview' },
  { key: 'blogs', href: '/admin/blogs', label: 'Blogs' },
  { key: 'projects', href: '/admin/projects', label: 'Projects' },
  { key: 'photos', href: '/admin/photos', label: 'Photos' },
  { key: 'testimonials', href: '/admin/testimonials', label: 'Testimonials' },
  { key: 'journey', href: '/admin/journey', label: 'Journey' },
  { key: 'landing', href: '/admin/landing', label: 'Landing' },
  { key: 'movies', href: '/admin/movies', label: 'Movies' },
  { key: 'tv', href: '/admin/tv', label: 'TV' },
  { key: 'music', href: '/admin/music', label: 'Music' },
  { key: 'media', href: '/admin/media', label: 'Media' },
  { key: 'settings', href: '/admin/settings', label: 'Settings' },
];

const STATIC_META = {
  '/admin': {
    title: 'Dashboard',
    description: 'A private overview of every editorial surface that will be CMS-managed.',
  },
  '/admin/blogs': {
    title: 'Blogs',
    description: 'Manage essays, publication state, SEO metadata, and project-linked writeups.',
  },
  '/admin/blogs/new': {
    title: 'New Blog Draft',
    description: 'The editor will land in the next phase; this route now anchors workflow and permissions.',
  },
  '/admin/projects': {
    title: 'Projects',
    description: 'Manage case studies, cards, links, media, and project-to-blog relationships.',
  },
  '/admin/projects/new': {
    title: 'New Project',
    description: 'Project authoring will reuse the shared validation and media pipeline shipped in this foundation.',
  },
  '/admin/photos': {
    title: 'Photos',
    description: 'Manage gallery entries, metadata, ordering, and future media uploads.',
  },
  '/admin/testimonials': {
    title: 'Testimonials',
    description: 'Manage quotes, attribution, avatars, and landing-page ordering.',
  },
  '/admin/journey': {
    title: 'Journey',
    description: 'Manage timeline entries, display order, imagery, and placement.',
  },
  '/admin/landing': {
    title: 'Landing Configuration',
    description: 'Control fixed homepage slots without changing the visual grid.',
  },
  '/admin/movies': {
    title: 'Movies',
    description: 'Manage films, watch state, posters, and future dedicated media pages.',
  },
  '/admin/tv': {
    title: 'TV Series',
    description: 'Manage series, watch state, artwork, and dedicated TV listings.',
  },
  '/admin/music': {
    title: 'Music',
    description: 'Manage all-time favorites, monthly listening collections, and individual entries.',
  },
  '/admin/media': {
    title: 'Media Library',
    description: 'Track reusable uploads, storage paths, types, and validation status.',
  },
  '/admin/settings': {
    title: 'Settings',
    description: 'Review environment assumptions, admin account setup, and operational notes.',
  },
  '/admin/sign-in': {
    title: 'Sign In',
    description: 'Authenticate with the private admin account before entering the editorial workspace.',
  },
  '/admin/unauthorized': {
    title: 'Unauthorized',
    description: 'This account is signed in but has not been granted CMS access.',
  },
};

export function getAdminPageMeta(pathname) {
  if (STATIC_META[pathname]) return STATIC_META[pathname];
  if (/^\/admin\/blogs\/[^/]+$/.test(pathname)) {
    return {
      title: 'Edit Blog Draft',
      description: 'The full editor is intentionally deferred; permissions and routing are ready now.',
    };
  }
  if (/^\/admin\/projects\/[^/]+$/.test(pathname)) {
    return {
      title: 'Edit Project',
      description: 'Project editing will be enabled in the next phase on top of this foundation.',
    };
  }
  return STATIC_META['/admin'];
}
