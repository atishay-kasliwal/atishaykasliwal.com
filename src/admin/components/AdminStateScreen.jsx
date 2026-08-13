import React from 'react';
import { AdminPanel } from './AdminPrimitives.jsx';
import AdminIcon from './AdminIcon.jsx';

const TONE_ICONS = {
  loading: 'refresh',
  warning: 'warning',
  default: 'sparkles',
};

export default function AdminStateScreen({ eyebrow, title, description, tone = 'default', actions }) {
  return (
    <section className={`admin-auth admin-auth--${tone}`}>
      <div className="admin-auth__backdrop" aria-hidden="true" />
      <AdminPanel className="admin-auth__panel">
        <div className="admin-auth__brand">
          <span className="admin-auth__brandMark">
            <AdminIcon name={TONE_ICONS[tone] || TONE_ICONS.default} size={18} />
          </span>
          <span>Atishay CMS</span>
        </div>

        {eyebrow ? <p className="admin-auth__eyebrow">{eyebrow}</p> : null}
        <h1 className="admin-auth__title">{title}</h1>
        <p className="admin-auth__description">{description}</p>
        {actions ? <div className="admin-auth__actions">{actions}</div> : null}
      </AdminPanel>
    </section>
  );
}
