import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAdminAuth } from '../auth/AdminAuthProvider.jsx';
import { AdminBadge, AdminButton, AdminField, AdminInput, AdminPanel } from '../components/AdminPrimitives.jsx';
import AdminStateScreen from '../components/AdminStateScreen.jsx';
import AdminIcon from '../components/AdminIcon.jsx';

const USERNAME_STORAGE_KEY = 'ak-admin-remembered-username';

function readRememberedUsername(fallback) {
  if (typeof window === 'undefined') return fallback;
  return window.localStorage.getItem(USERNAME_STORAGE_KEY) || fallback;
}

export default function AdminSignInPage() {
  const auth = useAdminAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/admin';
  const loggedOut = searchParams.get('loggedOut') === '1';

  const [username, setUsername] = useState(() => readRememberedUsername(auth.adminUsername));
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (auth.authorized) {
      navigate(next, { replace: true });
    }
  }, [auth.authorized, navigate, next]);

  const passwordHelp = useMemo(() => {
    if (auth.error) return null;
    return 'Use the private password for this portfolio workspace.';
  }, [auth.error]);

  if (auth.loading) {
    return (
      <AdminStateScreen
        eyebrow="Admin sign-in"
        title="Preparing your workspace"
        description="Checking the current session and restoring the private editorial routes."
        tone="loading"
      />
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (typeof window !== 'undefined') {
      if (rememberMe) {
        window.localStorage.setItem(USERNAME_STORAGE_KEY, username);
      } else {
        window.localStorage.removeItem(USERNAME_STORAGE_KEY);
      }
    }

    await auth.signIn({ username, password });
  }

  return (
    <section className="admin-auth">
      <div className="admin-auth__backdrop" aria-hidden="true" />
      <AdminPanel className="admin-auth__panel admin-auth__panel--signIn">
        <div className="admin-auth__brand">
          <span className="admin-auth__brandMark">
            <AdminIcon name="sparkles" size={18} />
          </span>
          <span>Atishay CMS</span>
        </div>

        <div className="admin-auth__hero">
          <p className="admin-auth__eyebrow">Admin sign-in</p>
          <h1 className="admin-auth__title">Enter the editorial workspace</h1>
          <p className="admin-auth__description">
            Sign in with the private admin account used to manage writing, projects, media, and landing-page content.
          </p>
          {loggedOut ? <AdminBadge tone="success">You signed out successfully.</AdminBadge> : null}
        </div>

        <form className="admin-authForm" onSubmit={handleSubmit}>
          <AdminField label="Username" hint={`Configured as ${auth.adminUsername}`}>
            <AdminInput
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </AdminField>

          <AdminField label="Password" hint={passwordHelp} error={auth.error || ''}>
            <div className="admin-passwordField">
              <AdminInput
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="admin-inlineControl"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </AdminField>

          <div className="admin-authForm__meta">
            <label className="admin-check">
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
              <span>Remember this username</span>
            </label>
            <a href="mailto:hire@atishaykasliwal.com?subject=Admin%20password%20help" className="admin-inlineLink">
              Forgot password?
            </a>
          </div>

          <div className="admin-auth__actions">
            <AdminButton type="submit" tone="primary" icon="chevronRight" iconSide="right">
              Sign in
            </AdminButton>
          </div>
        </form>
      </AdminPanel>
    </section>
  );
}
