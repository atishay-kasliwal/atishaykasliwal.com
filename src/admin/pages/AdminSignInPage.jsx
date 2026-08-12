import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminStateScreen from '../components/AdminStateScreen.jsx';
import { useAdminAuth } from '../auth/AdminAuthProvider.jsx';

export default function AdminSignInPage() {
  const auth = useAdminAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/admin';
  const [username, setUsername] = useState(auth.adminUsername);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (auth.authorized) {
      navigate(next, { replace: true });
    }
  }, [auth.authorized, navigate, next]);

  if (auth.loading) {
    return (
      <AdminStateScreen
        eyebrow="Admin Sign-In"
        title="Preparing the admin workspace"
        description="Checking your session and restoring access to the private editorial workspace."
        tone="loading"
      />
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await auth.signIn({ username, password });
  }

  return (
    <section className="admin-state admin-state--default">
      <div className="admin-state__inner">
        <p className="admin-state__eyebrow">Admin Sign-In</p>
        <h1 className="admin-state__title">Enter the editorial workspace</h1>
        <p className="admin-state__description">
          Use the private admin username and password for this portfolio. After the first login,
          you can change the password from Settings.
        </p>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label className="admin-field">
            <span>Username</span>
            <input
              className="admin-input"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label className="admin-field">
            <span>Password</span>
            <input
              className="admin-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <div className="admin-state__actions">
            <button type="submit" className="admin-button">
              Sign in
            </button>
          </div>
        </form>

        <p className="admin-muted">Configured admin username: {auth.adminUsername}</p>
        {auth.error ? <p className="admin-inlineMessage">{auth.error}</p> : null}
      </div>
    </section>
  );
}
