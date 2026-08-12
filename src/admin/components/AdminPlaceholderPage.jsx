import React from 'react';

export default function AdminPlaceholderPage({
  eyebrow,
  title,
  description,
  points = [],
  note,
}) {
  return (
    <section className="admin-placeholder">
      <div className="admin-placeholder__hero">
        <p className="admin-placeholder__eyebrow">{eyebrow}</p>
        <h2 className="admin-placeholder__title">{title}</h2>
        <p className="admin-placeholder__description">{description}</p>
      </div>

      <div className="admin-placeholder__panel">
        <h3 className="admin-placeholder__panelTitle">What this module will manage</h3>
        <ul className="admin-placeholder__list">
          {points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>

      {note ? <p className="admin-placeholder__note">{note}</p> : null}
    </section>
  );
}
