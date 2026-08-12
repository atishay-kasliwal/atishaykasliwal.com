import React from 'react';

export default function AdminStateScreen({ eyebrow, title, description, tone = 'default', actions }) {
  return (
    <section className={`admin-state admin-state--${tone}`} aria-live="polite">
      <div className="admin-state__inner">
        {eyebrow ? <p className="admin-state__eyebrow">{eyebrow}</p> : null}
        <h1 className="admin-state__title">{title}</h1>
        <p className="admin-state__description">{description}</p>
        {actions ? <div className="admin-state__actions">{actions}</div> : null}
      </div>
    </section>
  );
}
