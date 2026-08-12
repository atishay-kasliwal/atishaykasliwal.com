import React, { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Seo from '../seo/Seo';
import { collectionPageSchema } from '../seo/schema.js';
import { resolveMeta } from '../seo/routes.js';
import ClientOnly from '../components/ClientOnly';
import TrailerHero from '../components/browse/TrailerHero';
import ProjectRow from '../components/browse/ProjectRow';
import ProjectModal from '../components/browse/ProjectModal';
import BlogCollage from '../components/browse/BlogCollage';
import { GITHUB_COLLECTIONS, findProject } from '../data/githubProjects.js';
import { abs } from '../data/site.js';
import { trackEvent } from '../lib/analytics';
import { getProjectCollections, getProjects } from '../lib/content/publicContent.js';
import './ProjectsPage.css';

/**
 * /projects — browse page.
 *
 * Replaces both the old case-study grid here and the retired /highlights index.
 * The structure is Netflix's because it suits the material: ten-odd systems,
 * each better shown running than described, where the useful browsing question
 * is "what kind of thing is this" rather than "what is it called".
 *
 * The open overlay lives in the URL as ?p=<slug> rather than in component
 * state. Three things fall out of that for free: an open project is a
 * shareable link, Back closes the overlay instead of leaving the page, and a
 * cold load of ?p=… opens straight onto that project. `replace: true` keeps
 * opening and closing from stacking history entries — otherwise browsing five
 * projects means five Backs to leave the page.
 *
 * Rows come from COLLECTIONS in the data layer, deliberately not from
 * PROJECT_CATEGORIES: row membership is editorial and overlapping (a project
 * can sit in both "Try it live" and "Applied research"), which a category
 * filter cannot express.
 */
export default function ProjectsPage() {
  const meta = resolveMeta('/projects');
  const [searchParams, setSearchParams] = useSearchParams();

  const activeSlug = searchParams.get('p');
  /* findProject rather than getProject: a slug in the URL can now name either a
     curated case study or one of the repo-derived records. */
  const activeProject = activeSlug ? findProject(activeSlug) : null;

  const openInfo = useCallback(
    (slug) => {
      /* Which projects get opened for detail is the useful signal from this
         page — a click through to a demo is already tracked as a pageview on
         the destination, but an overlay open never leaves the route. */
      trackEvent('project_info_open', { project: slug });

      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('p', slug);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const closeInfo = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('p');
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  /* Rows are resolved once. An empty row renders nothing (ProjectRow bails on
     an empty list), so a collection naming projects that do not exist yet is
     harmless rather than a hole in the page. */
  const rows = useMemo(
    () => getProjectCollections().filter((row) => row.projects.length > 0),
    []
  );

  const githubRows = useMemo(
    () => GITHUB_COLLECTIONS.filter((row) => row.projects.length > 0),
    []
  );

  const schema = collectionPageSchema(
    meta,
    getProjects().map((p) => ({ url: abs(`/projects/${p.slug}`), name: p.name }))
  );

  return (
    <>
      <Seo path="/projects" schema={[schema]} />

      <div className="projects-page">
        {/* The page's <h1> is visually hidden rather than rendered as a
            PageHeader above the hero. A hero this size wants to be the first
            thing on screen, but the document still needs exactly one h1 that
            states what the page is — the hero's own heading names whichever
            project happens to be showing, which is not the same claim. */}
        <h1 className="sr-only">
          Projects by Atishay Kasliwal — systems designed, shipped, and operated
        </h1>

        <TrailerHero onInfo={openInfo} />

        <div className="projects-browse">
          {rows.map((row) => (
            <ProjectRow
              key={row.id}
              title={row.title}
              projects={row.projects}
              onInfo={openInfo}
            />
          ))}

          <ProjectRow
            title="Everything"
            projects={getProjects()}
            onInfo={openInfo}
          />

          {/* Rows built from the GitHub snapshot. They sit BELOW the curated
              rows on purpose: a repo card carries a description and a language,
              while the rows above carry a case study each, and the page should
              lead with the deeper material. See src/data/githubProjects.js. */}
          {githubRows.map((row) => (
            <ProjectRow
              key={row.id}
              title={row.title}
              projects={row.projects}
              onInfo={openInfo}
            />
          ))}

          <BlogCollage />
        </div>

        {/* Gated behind ClientOnly because <dialog>.showModal() does not exist
            in Node, and an overlay has no business in the prerendered HTML —
            the crawler should see the browse page, not a detail panel. */}
        <ClientOnly>
          {activeProject ? (
            <ProjectModal project={activeProject} onClose={closeInfo} />
          ) : null}
        </ClientOnly>
      </div>
    </>
  );
}
