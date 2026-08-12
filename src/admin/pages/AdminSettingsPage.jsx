import React, { useState } from 'react';
import { useAdminAuth } from '../auth/AdminAuthProvider.jsx';

export default function AdminSettingsPage() {
  const auth = useAdminAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
    <section className="admin-settings">
      <div className="admin-placeholder__hero">
        <p className="admin-placeholder__eyebrow">cms_site_settings / security</p>
        <h2 className="admin-placeholder__title">Account security and environment setup</h2>
        <p className="admin-placeholder__description">
          The admin now signs in with a single username/password account. The editors still land
          in later phases, but account access is ready now.
        </p>
      </div>

      <div className="admin-settings__grid">
        <section className="admin-placeholder__panel">
          <h3 className="admin-placeholder__panelTitle">Current admin account</h3>
          <dl className="admin-details">
            <div>
              <dt>Username</dt>
              <dd>{auth.adminUsername}</dd>
            </div>
            <div>
              <dt>Auth email</dt>
              <dd>{auth.adminAuthEmail}</dd>
            </div>
            <div>
              <dt>Claim enforcement</dt>
              <dd>{auth.hasClaim ? 'Firebase admin claim present' : 'Frontend-only admin route access'}</dd>
            </div>
          </dl>
        </section>

        <section className="admin-placeholder__panel">
          <h3 className="admin-placeholder__panelTitle">Change password</h3>
          <form className="admin-form" onSubmit={handleSubmit}>
            <label className="admin-field">
              <span>Current password</span>
              <input
                className="admin-input"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </label>

            <label className="admin-field">
              <span>New password</span>
              <input
                className="admin-input"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={nextPassword}
                onChange={(event) => setNextPassword(event.target.value)}
              />
            </label>

            <label className="admin-field">
              <span>Confirm new password</span>
              <input
                className="admin-input"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </label>

            <div className="admin-form__actions">
              <button type="submit" className="admin-button" disabled={submitting}>
                {submitting ? 'Updating…' : 'Update password'}
              </button>
            </div>
          </form>

          {message ? <p className="admin-successMessage">{message}</p> : null}
          {error ? <p className="admin-inlineMessage">{error}</p> : null}
        </section>
      </div>

      <p className="admin-placeholder__note">
        If sign-in is not working, the usual cause is missing Firebase client config or the
        Email/Password provider not being enabled in Firebase Authentication.
      </p>
    </section>
  );
}
