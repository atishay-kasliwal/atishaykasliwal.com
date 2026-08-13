import { sentenceCase } from './lib/adminUtils.js';

export const ADMIN_NAV_GROUPS = [
  {
    key: 'workspace',
    label: 'Workspace',
    items: ['overview'],
  },
  {
    key: 'content',
    label: 'Content',
    items: ['blogs', 'projects', 'photos', 'testimonials', 'journey'],
  },
  {
    key: 'entertainment',
    label: 'Entertainment',
    items: ['movies', 'tv', 'music'],
  },
  {
    key: 'system',
    label: 'System',
    items: ['media', 'landing', 'settings'],
  },
];

export const ADMIN_MODULES = {
  overview: {
    key: 'overview',
    href: '/admin',
    label: 'Overview',
    group: 'workspace',
    icon: 'dashboard',
    description: 'Operational view of live content, drafts, and publishing readiness.',
  },
  blogs: {
    key: 'blogs',
    collection: 'cms_posts',
    href: '/admin/blogs',
    label: 'Blogs',
    singular: 'Blog',
    group: 'content',
    icon: 'fileText',
    supportsGrid: false,
    supportsCreate: true,
    supportsEditor: true,
    createPath: '/admin/blogs/new',
    description: 'Draft, review, and manage long-form writing, metadata, and related project writeups.',
  },
  projects: {
    key: 'projects',
    collection: 'cms_projects',
    href: '/admin/projects',
    label: 'Projects',
    singular: 'Project',
    group: 'content',
    icon: 'sparkles',
    supportsGrid: true,
    supportsCreate: true,
    supportsEditor: true,
    createPath: '/admin/projects/new',
    description: 'Control case studies, featured portfolio items, links, and supporting narrative.',
  },
  photos: {
    key: 'photos',
    collection: 'cms_photos',
    href: '/admin/photos',
    label: 'Photos',
    singular: 'Photo',
    group: 'content',
    icon: 'camera',
    supportsGrid: true,
    supportsCreate: true,
    supportsEditor: true,
    createPath: '/admin/photos/new',
    description: 'Organize photography, metadata, gallery sequencing, and visual presentation.',
  },
  testimonials: {
    key: 'testimonials',
    collection: 'cms_testimonials',
    href: '/admin/testimonials',
    label: 'Testimonials',
    singular: 'Testimonial',
    group: 'content',
    icon: 'message',
    supportsGrid: false,
    supportsCreate: true,
    supportsEditor: true,
    createPath: '/admin/testimonials/new',
    description: 'Maintain quotes, attribution, visibility, and homepage ordering.',
  },
  journey: {
    key: 'journey',
    collection: 'cms_journey_entries',
    href: '/admin/journey',
    label: 'Journey',
    singular: 'Journey entry',
    group: 'content',
    icon: 'timeline',
    supportsGrid: true,
    supportsCreate: true,
    supportsEditor: true,
    createPath: '/admin/journey/new',
    description: 'Update the timeline, ordering, imagery, and milestones that power the homepage story.',
  },
  movies: {
    key: 'movies',
    collection: 'cms_movies',
    href: '/admin/movies',
    label: 'Movies',
    singular: 'Movie',
    group: 'entertainment',
    icon: 'clapperboard',
    supportsGrid: true,
    supportsCreate: true,
    supportsEditor: true,
    createPath: '/admin/movies/new',
    description: 'Track film entries, artwork, visibility, and watch-state metadata.',
  },
  tv: {
    key: 'tv',
    collection: 'cms_tv_series',
    href: '/admin/tv',
    label: 'TV',
    singular: 'TV series',
    group: 'entertainment',
    icon: 'tv',
    supportsGrid: true,
    supportsCreate: true,
    supportsEditor: true,
    createPath: '/admin/tv/new',
    description: 'Manage television entries, progress state, artwork, and future dedicated pages.',
  },
  music: {
    key: 'music',
    collection: 'cms_music_entries',
    href: '/admin/music',
    label: 'Music',
    singular: 'Music entry',
    group: 'entertainment',
    icon: 'music',
    supportsGrid: true,
    supportsCreate: true,
    supportsEditor: true,
    createPath: '/admin/music/new',
    description: 'Manage monthly listening, all-time favorites, and individual music entries.',
  },
  media: {
    key: 'media',
    collection: 'cms_media',
    href: '/admin/media',
    label: 'Media Library',
    singular: 'Media asset',
    group: 'system',
    icon: 'image',
    supportsGrid: true,
    supportsCreate: false,
    supportsEditor: true,
    description: 'Audit reusable assets, metadata, and where each file is currently used.',
  },
  landing: {
    key: 'landing',
    collection: 'cms_landing_config',
    href: '/admin/landing',
    label: 'Landing',
    singular: 'Landing configuration',
    group: 'system',
    icon: 'layout',
    supportsGrid: false,
    supportsCreate: false,
    supportsEditor: true,
    description: 'Choose which live content appears in the fixed homepage slots.',
  },
  settings: {
    key: 'settings',
    collection: 'cms_site_settings',
    href: '/admin/settings',
    label: 'Settings',
    singular: 'Settings',
    group: 'system',
    icon: 'settings',
    supportsGrid: false,
    supportsCreate: false,
    supportsEditor: false,
    description: 'Manage account security, appearance, branding defaults, and environment configuration.',
  },
};

export const ADMIN_NAV_ITEMS = Object.values(ADMIN_MODULES).filter((item) => item.href);

export function getModuleByKey(key) {
  return ADMIN_MODULES[key] || null;
}

export function getAdminPageMeta(pathname) {
  if (pathname === '/admin' || pathname === '/workspace') {
    return {
      title: 'Overview',
      description: ADMIN_MODULES.overview.description,
    };
  }

  const normalizedPath = pathname.replace(/^\/workspace/, '/admin');

  if (normalizedPath === '/admin/music/collections/new') {
    return {
      title: 'New Music Collection',
      description: 'Create a new ranked or monthly collection for the music workspace.',
    };
  }

  if (/^\/admin\/music\/collections\/[^/]+$/i.test(normalizedPath)) {
    return {
      title: 'Edit Music Collection',
      description: 'Review ordering, assigned entries, and publishing controls for this collection.',
    };
  }

  for (const module of Object.values(ADMIN_MODULES)) {
    if (normalizedPath === module.href) {
      return {
        title: module.label,
        description: module.description,
      };
    }

    if (module.supportsCreate && normalizedPath === `${module.href}/new`) {
      return {
        title: `New ${module.singular}`,
        description: `Create a new ${module.singular.toLowerCase()} draft inside the private workspace.`,
      };
    }

    if (module.supportsEditor && normalizedPath.startsWith(`${module.href}/`)) {
      return {
        title: `Edit ${module.singular}`,
        description: `Review details, metadata, status, and publishing controls for this ${module.singular.toLowerCase()}.`,
      };
    }
  }

  if (normalizedPath === '/admin/sign-in') {
    return {
      title: 'Sign In',
      description: 'Authenticate with the private editorial workspace.',
    };
  }

  if (normalizedPath === '/admin/unauthorized') {
    return {
      title: 'Access Required',
      description: 'This account is signed in but does not have access to the workspace.',
    };
  }

  return {
    title: sentenceCase(normalizedPath.split('/').filter(Boolean).slice(-1)[0] || 'Overview'),
    description: 'Private editorial workspace.',
  };
}
