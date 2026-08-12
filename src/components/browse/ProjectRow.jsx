import React from 'react';
import BrowseRail from './BrowseRail';
import ProjectCard from './ProjectCard';

/**
 * A rail of project tiles.
 *
 * All the scroll, chevron, and keyboard behaviour lives in BrowseRail, which
 * the writing row uses too. This is only the project-specific part: which tiles
 * go in, and what a tile does when clicked.
 */
export default function ProjectRow({ title, projects, onInfo }) {
  if (!projects.length) return null;

  return (
    <BrowseRail title={title}>
      {projects.map((project) => (
        <ProjectCard key={project.slug} project={project} onInfo={onInfo} />
      ))}
    </BrowseRail>
  );
}
