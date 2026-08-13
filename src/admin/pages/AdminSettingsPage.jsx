import React, { useMemo, useState } from 'react';
import { useAdminAuth } from '../auth/AdminAuthProvider.jsx';
import { useAdminTheme } from '../context/AdminThemeProvider.jsx';
import { useAdminWorkspace } from '../context/AdminWorkspaceProvider.jsx';
import { AdminBadge, AdminButton, AdminField, AdminInput, AdminPanel, AdminSectionHeader, AdminTabs } from '../components/AdminPrimitives.jsx';

const SETTINGS_SECTIONS = [
  { value: 'authentication', label: 'Authentication' },
  { value: 'appearance', label: 'Appearance' },
  { value: 'defaults', label: 'Content defaults' },
  { value: 'workspace', label: 'Workspace' },
  { value: 'danger', label: 'Danger zone' },
];

export default function AdminSettingsPage() {
  const auth = useAdminAuth();
  const { theme, setTheme } = useAdminTheme();
  const { lastSavedAt, collections, sync } = useAdminWorkspace();
  const [section, setSection] = useState('authentication');
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const workspaceCounts = useMemo(() => ({
    localDrafts: Object.values(collections).flat().filter((item) => item._source === 'local').length,
    liveCollections: Object.keys(collections).length,
  }), [collections]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!currentPassword || !nextPassword || !confirmPassword) {
      setError('Fill out all password fields before submitting.');
      return;
    }

    if (nextPassword.length < 8) {
      setError('Use a new password with at least 8 characters.');
      return;
    }

    if (nextPassword !== confirmPassword) {
      setError('The new password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    const result = await auth.changePassword({ currentPassword, nextPassword });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setCurrentPassword('');
    setNextPassword('');
    setConfirmPassword('');
    setMessage(result.message);
  }

  return (
    <section className="admin-page">
      <AdminSectionHeader
        eyebrow="Settings"
        title="Account, workspace, and defaults"
        description="Keep the private workspace secure, tune the interface, and review the current authoring and sync environment."
      />

      <div className="admin-settingsLayout">
        <div className="admin-settingsNav">
          <AdminTabs items={SETTINGS_SECTIONS} value={section} onChange={setSection} />
        </div>

        <div className="admin-settingsPanels">
          {section === 'authentication' ? (
            <AdminPanel>
              <AdminSectionHeader title="Authentication" description="Private account access and password management." />
              <div className="admin-settingsGrid">
                <div className="admin-stack">
                  <div className="admin-keyValue">
                    <span>Username</span>
                    <strong>{auth.adminUsername}</strong>
                  </div>
                  <div className="admin-keyValue">
                    <span>Auth email</span>
                    <strong>{auth.adminAuthEmail}</strong>
                  </div>
                  <div className="admin-keyValue">
                    <span>Claim enforcement</span>
                    <AdminBadge tone={auth.hasClaim ? 'success' : 'neutral'}>
                      {auth.hasClaim ? 'Required claim present' : 'Email allowlist only'}
                    </AdminBadge>
                  </div>
                </div>

                <form className="admin-stack" onSubmit={handleSubmit}>
                  <AdminField label="Current password">
                    <AdminInput
                      type="password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                    />
                  </AdminField>

                  <AdminField label="New password">
                    <AdminInput
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      value={nextPassword}
                      onChange={(event) => setNextPassword(event.target.value)}
                    />
                  </AdminField>

                  <AdminField label="Confirm new password" error={error || ''}>
                    <AdminInput
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </AdminField>

                  <div className="admin-inlineActions">
                    <AdminButton type="submit" tone="primary" disabled={submitting}>
                      {submitting ? 'Updating…' : 'Update password'}
                    </AdminButton>
                    {message ? <AdminBadge tone="success">{message}</AdminBadge> : null}
                  </div>
                </form>
              </div>
            </AdminPanel>
          ) : null}

          {section === 'appearance' ? (
            <AdminPanel>
              <AdminSectionHeader title="Appearance" description="Switch between the dark and light admin themes." />
              <div className="admin-inlineActions">
                <AdminButton tone={theme === 'dark' ? 'primary' : 'ghost'} onClick={() => setTheme('dark')}>
                  Dark theme
                </AdminButton>
                <AdminButton tone={theme === 'light' ? 'primary' : 'ghost'} onClick={() => setTheme('light')}>
                  Light theme
                </AdminButton>
              </div>
            </AdminPanel>
          ) : null}

          {section === 'defaults' ? (
            <AdminPanel>
              <AdminSectionHeader title="Content defaults" description="Current repository-backed defaults used by the public site." />
              <div className="admin-stack">
                <div className="admin-keyValue">
                  <span>Default admin title</span>
                  <strong>Editorial workspace</strong>
                </div>
                <div className="admin-keyValue">
                  <span>Authoring locale</span>
                  <strong>en</strong>
                </div>
                <div className="admin-keyValue">
                  <span>Timezone</span>
                  <strong>America/New_York</strong>
                </div>
              </div>
            </AdminPanel>
          ) : null}

          {section === 'workspace' ? (
            <AdminPanel>
              <AdminSectionHeader
                title="Workspace"
                description={
                  sync.mode === 'firebase'
                    ? 'This browser is connected to the Firebase CMS with local fallback only when sync fails.'
                    : 'This browser is currently using local workspace storage only.'
                }
              />
              <div className="admin-stack">
                <div className="admin-keyValue">
                  <span>Collections available</span>
                  <strong>{workspaceCounts.liveCollections}</strong>
                </div>
                <div className="admin-keyValue">
                  <span>Primary sync target</span>
                  <strong>{sync.label}</strong>
                </div>
                <div className="admin-keyValue">
                  <span>Pending writes</span>
                  <strong>{sync.pendingWrites}</strong>
                </div>
                <div className="admin-keyValue">
                  <span>Local overrides and drafts</span>
                  <strong>{workspaceCounts.localDrafts}</strong>
                </div>
                <div className="admin-keyValue">
                  <span>Last authoring change</span>
                  <strong>{lastSavedAt ? new Date(lastSavedAt).toLocaleString() : 'No saves yet'}</strong>
                </div>
                <div className="admin-keyValue">
                  <span>Last Firebase sync</span>
                  <strong>{sync.lastSyncedAt ? new Date(sync.lastSyncedAt).toLocaleString() : 'No remote sync yet'}</strong>
                </div>
                {sync.error ? (
                  <AdminBadge tone="warning">{sync.error}</AdminBadge>
                ) : null}
              </div>
            </AdminPanel>
          ) : null}

          {section === 'danger' ? (
            <AdminPanel className="admin-dangerZone">
              <AdminSectionHeader title="Danger zone" description="Session-level actions that affect the current browser only." />
              <div className="admin-inlineActions">
                <AdminButton tone="danger" onClick={auth.signOut}>
                  Sign out everywhere in this browser
                </AdminButton>
              </div>
            </AdminPanel>
          ) : null}
        </div>
      </div>
    </section>
  );
}
