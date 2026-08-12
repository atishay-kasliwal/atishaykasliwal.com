import React from 'react';
import {
  getJourneyEntries,
  getMovies,
  getMusicCollections,
  getMusicEntries,
  getPhotos,
  getPosts,
  getProjects,
  getTestimonials,
  getTvSeries,
} from '../../lib/content/publicContent.js';

const MODULE_COUNTS = [
  { label: 'Posts', value: getPosts().length },
  { label: 'Projects', value: getProjects().length },
  { label: 'Photos', value: getPhotos().length },
  { label: 'Testimonials', value: getTestimonials().length },
  { label: 'Journey', value: getJourneyEntries().length },
  { label: 'Movies', value: getMovies().length },
  { label: 'TV Series', value: getTvSeries().length },
  { label: 'Music Entries', value: getMusicEntries().length },
  { label: 'Music Collections', value: getMusicCollections().length },
];

export default function AdminOverviewPage() {
  return (
    <section className="admin-overview">
      <div className="admin-overview__grid">
        {MODULE_COUNTS.map((item) => (
          <article key={item.label} className="admin-metricCard">
            <span className="admin-metricCard__label">{item.label}</span>
            <strong className="admin-metricCard__value">{item.value}</strong>
          </article>
        ))}
      </div>

      <div className="admin-overview__notes">
        <article className="admin-noteCard">
          <h2>Foundation shipped in this phase</h2>
          <p>
            Validation, route protection, Firebase separation, CMS schemas, rules, and the public
            content service are now in place. Editors and publish actions intentionally come next.
          </p>
        </article>

        <article className="admin-noteCard">
          <h2>Public site delivery</h2>
          <p>
            Published content still flows through the existing static build and prerender pipeline,
            which keeps public performance and SEO behavior unchanged while authoring stays private.
          </p>
        </article>
      </div>
    </section>
  );
}
