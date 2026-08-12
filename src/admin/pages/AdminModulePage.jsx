import React from 'react';
import { useParams } from 'react-router-dom';
import AdminPlaceholderPage from '../components/AdminPlaceholderPage.jsx';

const MODULE_COPY = {
  blogs: {
    eyebrow: 'cms_posts',
    title: 'Blog library and editorial workflow',
    description:
      'Drafts, publish state, metadata, cover media, and project-linked writeups will be managed here.',
    points: [
      'Create and edit markdown-backed long-form posts.',
      'Validate slug uniqueness, SEO lengths, and state transitions.',
      'Connect project writeups without exposing drafts publicly.',
    ],
    note: 'This phase deliberately stops before shipping the full text editor.',
  },
  blogNew: {
    eyebrow: 'cms_posts / new',
    title: 'New blog draft route reserved',
    description:
      'Routing, permissions, and validation contracts are in place so the editor can land cleanly next.',
    points: [
      'Draft creation will write into private authoring collections.',
      'Publishing will validate independently of the form UI.',
      'Media and related-project references already have schema support.',
    ],
    note: 'No fake editor is shown here on purpose.',
  },
  blogEdit: {
    eyebrow: 'cms_posts / edit',
    title: 'Existing blog draft route reserved',
    description:
      'This route now proves that protected deep links and redirect restoration work before editors are added.',
    points: [
      'Signed-in admins can deep-link straight to an item-specific route.',
      'Unauthorized accounts are redirected out with a clear reason.',
      'Future editors will reuse the shared validation layer already added.',
    ],
  },
  projects: {
    eyebrow: 'cms_projects',
    title: 'Project catalog management',
    description:
      'Projects, writeups, media, stack metadata, and case-study relationships will be managed here.',
    points: [
      'Create and edit portfolio projects without touching source files.',
      'Control links, featured flags, and project-to-blog associations.',
      'Keep public snapshots aligned with the existing browse and case-study pages.',
    ],
  },
  projectNew: {
    eyebrow: 'cms_projects / new',
    title: 'New project route reserved',
    description:
      'The create flow will plug into the same validation and media services that already back the rest of the foundation.',
    points: [
      'Slug, status, visibility, and link validation are ready.',
      'Landing-slot compatibility checks are already defined.',
      'Public browse rows can stay visually unchanged while data becomes editable.',
    ],
  },
  projectEdit: {
    eyebrow: 'cms_projects / edit',
    title: 'Existing project route reserved',
    description:
      'This route anchors future per-project editing without changing the current public project pages.',
    points: [
      'Deep-link editing works with the protected route guard.',
      'Related writeup and media references already have schema coverage.',
      'Publishing will remain a separate, explicit step in the next phase.',
    ],
  },
  photos: {
    eyebrow: 'cms_photos',
    title: 'Photo archive management',
    description:
      'Gallery entries, metadata, display order, and future upload references will live here.',
    points: [
      'Manage photo ordering for the art page and embedded galleries.',
      'Validate media references against the CMS media library.',
      'Keep photography pages static on the public site until publish time.',
    ],
  },
  testimonials: {
    eyebrow: 'cms_testimonials',
    title: 'Testimonials management',
    description:
      'Quotes, attribution, avatars, and homepage ordering will be managed here.',
    points: [
      'Store real attribution with controlled visibility.',
      'Support landing-page slot ordering without changing the layout.',
      'Preserve private draft testimonials until explicitly published.',
    ],
  },
  journey: {
    eyebrow: 'cms_journey_entries',
    title: 'Journey timeline management',
    description:
      'Timeline entries, dates, roles, imagery, and display order will be managed here.',
    points: [
      'Edit or replace timeline entries without touching the component.',
      'Control which entries appear on the homepage.',
      'Reuse shared media validation for image-backed entries.',
    ],
  },
  landing: {
    eyebrow: 'cms_landing_config',
    title: 'Landing slot configuration',
    description:
      'Fixed homepage slots will be configured here while the visual grid and hierarchy stay exactly as designed.',
    points: [
      'Swap which testimonials, journey items, and highlights appear.',
      'Validate slot limits and duplicate exclusive assignments.',
      'Keep the homepage structure static while content choices become editable.',
    ],
  },
  movies: {
    eyebrow: 'cms_movies',
    title: 'Movies management',
    description:
      'Films, posters, watch state, and future dedicated movie pages will be managed here.',
    points: [
      'Track favorites and current watching state.',
      'Prepare data for the future dedicated movies page.',
      'Reuse shared media and visibility controls.',
    ],
  },
  tv: {
    eyebrow: 'cms_tv_series',
    title: 'TV series management',
    description:
      'Series entries, statuses, art, and future dedicated TV pages will be managed here.',
    points: [
      'Keep TV data separate from movie data.',
      'Support current watching state and archival history.',
      'Publish into static snapshots later without changing page design.',
    ],
  },
  music: {
    eyebrow: 'cms_music_entries + cms_music_collections',
    title: 'Music management',
    description:
      'Monthly listening, all-time favorites, and individual tracks or albums will be managed here.',
    points: [
      'Support monthly collections alongside all-time favorites.',
      'Validate entry-to-collection relationships before publish.',
      'Keep About-page taste modules compatible with future dedicated pages.',
    ],
  },
  media: {
    eyebrow: 'cms_media',
    title: 'Media library',
    description:
      'Uploads, file metadata, storage paths, and validation state will be tracked here.',
    points: [
      'Store predictable CMS upload paths under a locked storage prefix.',
      'Validate MIME types and file-size limits.',
      'Reuse media records across posts, projects, photos, and testimonials.',
    ],
  },
  settings: {
    eyebrow: 'cms_site_settings',
    title: 'Site and operational settings',
    description:
      'Shared site settings, environment expectations, and admin-operation guidance will surface here.',
    points: [
      'Keep configuration visible without exposing secrets.',
      'Document environment assumptions for local development and production.',
      'Make room for later publish controls and operational toggles.',
    ],
  },
};

export default function AdminModulePage({ moduleKey }) {
  const params = useParams();
  const copy = MODULE_COPY[moduleKey];

  if (!copy) return null;

  return (
    <AdminPlaceholderPage
      eyebrow={copy.eyebrow}
      title={copy.title}
      description={copy.description}
      points={copy.points}
      note={
        moduleKey === 'blogEdit' || moduleKey === 'projectEdit'
          ? `Active document id: ${params.id}`
          : copy.note
      }
    />
  );
}
