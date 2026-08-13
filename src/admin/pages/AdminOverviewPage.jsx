import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminWorkspace } from '../context/AdminWorkspaceProvider.jsx';
import { AdminBadge, AdminButton, AdminPanel, AdminSectionHeader, AdminStatusBadge } from '../components/AdminPrimitives.jsx';
import AdminIcon from '../components/AdminIcon.jsx';
import { formatAdminDate } from '../lib/adminUtils.js';

export default function AdminOverviewPage() {
  const { overviewMetrics, recentActivity, contentBreakdown, insights, collections } = useAdminWorkspace();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const localDrafts = Object.values(collections)
    .flat()
    .filter((item) => item.status === 'draft')
    .slice(0, 6);

  return (
    <section className="admin-page">
      <AdminSectionHeader
        eyebrow={today}
        title="Editorial overview"
        description="Track live content, drafts, and the small details worth fixing before the next publish window."
        actions={
          <div className="admin-inlineActions">
            <AdminButton as={Link} to="/admin/blogs/new" tone="primary" icon="plus">
              Create content
            </AdminButton>
            <AdminButton as={Link} to="/admin/landing" tone="ghost" icon="layout">
              Review landing slots
            </AdminButton>
          </div>
        }
      />

      <div className="admin-metricGrid">
        {overviewMetrics.map((item) => (
          <AdminPanel key={item.key} className="admin-metricCard">
            <span className="admin-metricCard__label">{item.label}</span>
            <strong className="admin-metricCard__value">{item.value}</strong>
          </AdminPanel>
        ))}
      </div>

      <div className="admin-pageGrid">
        <AdminPanel>
          <AdminSectionHeader
            title="Recent activity"
            description="Content already carrying real dates or recent editorial changes."
          />
          <div className="admin-list">
            {recentActivity.length === 0 ? (
              <p className="admin-muted">No recent activity is available yet.</p>
            ) : (
              recentActivity.map((item) => (
                <Link key={item.id} to={item.href} className="admin-listRow">
                  <div className="admin-listRow__leading">
                    <span className="admin-listRow__icon">
                      <AdminIcon name="refresh" size={15} />
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.moduleLabel}</small>
                    </div>
                  </div>
                  <span className="admin-listRow__meta">{formatAdminDate(item.date)}</span>
                </Link>
              ))
            )}
          </div>
        </AdminPanel>

        <AdminPanel>
          <AdminSectionHeader
            title="Needs attention"
            description="Derived from the current repository data, saved drafts, and schema validation."
          />
          <div className="admin-list">
            {insights.length === 0 ? (
              <p className="admin-muted">Everything looks clean right now.</p>
            ) : (
              insights.map((item) => (
                <Link key={item.title} to={item.href} className="admin-listRow">
                  <div className="admin-listRow__leading">
                    <span className={`admin-listRow__tone admin-listRow__tone--${item.level}`} />
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                    </div>
                  </div>
                  {item.count != null ? <AdminBadge tone={item.level === 'warning' ? 'warning' : 'neutral'}>{item.count}</AdminBadge> : null}
                </Link>
              ))
            )}
          </div>
        </AdminPanel>
      </div>

      <div className="admin-pageGrid admin-pageGrid--three">
        <AdminPanel>
          <AdminSectionHeader title="Drafts waiting for completion" description="Local editorial drafts that still need finishing work." />
          <div className="admin-list">
            {localDrafts.length === 0 ? (
              <p className="admin-muted">No drafts are waiting right now.</p>
            ) : (
              localDrafts.map((item) => (
                <div key={item.id} className="admin-listRow">
                  <div className="admin-listRow__leading">
                    <div>
                      <strong>{item.title || 'Untitled draft'}</strong>
                      <small>{item.slug || item.id}</small>
                    </div>
                  </div>
                  <AdminStatusBadge status={item.status} />
                </div>
              ))
            )}
          </div>
        </AdminPanel>

        <AdminPanel>
          <AdminSectionHeader title="Content by type" description="Current live library volumes across the workspace." />
          <div className="admin-breakdown">
            {contentBreakdown.map((item) => (
              <div key={item.key} className="admin-breakdown__row">
                <span>{item.label}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel>
          <AdminSectionHeader title="Quick actions" description="The routes used most often when updating the site." />
          <div className="admin-actionGrid">
            <AdminButton as={Link} to="/admin/blogs/new" tone="ghost" icon="fileText">
              New blog
            </AdminButton>
            <AdminButton as={Link} to="/admin/projects/new" tone="ghost" icon="sparkles">
              New project
            </AdminButton>
            <AdminButton as={Link} to="/admin/music/new" tone="ghost" icon="music">
              Add music
            </AdminButton>
            <AdminButton as={Link} to="/admin/media" tone="ghost" icon="image">
              Open media library
            </AdminButton>
          </div>
        </AdminPanel>
      </div>
    </section>
  );
}
