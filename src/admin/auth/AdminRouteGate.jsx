import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { resolveAdminRouteDecision } from '../../lib/firebase/admin.js';
import AdminStateScreen from '../components/AdminStateScreen';
import { useAdminAuth } from './AdminAuthProvider.jsx';

export default function AdminRouteGate({ children }) {
  const auth = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const decision = resolveAdminRouteDecision(auth, location);

  useEffect(() => {
    if (!decision.redirectTo) return;
    navigate(decision.redirectTo, { replace: true });
  }, [decision.redirectTo, navigate]);

  if (decision.status === 'loading') {
    return (
      <AdminStateScreen
        eyebrow="Authorizing"
        title="Restoring your editorial session"
        description="Checking your current session and administrator permissions."
        tone="loading"
      />
    );
  }

  if (decision.status === 'config_error') {
    return (
      <AdminStateScreen
        eyebrow="Configuration"
        title="Admin authentication is not configured"
        description="Add the Firebase client variables and administrator allowlist before using the admin workspace."
        tone="warning"
      />
    );
  }

  if (decision.status === 'signed_out') {
    return (
      <AdminStateScreen
        eyebrow="Redirecting"
        title="Sign-in required"
        description="Sending you to the private sign-in screen for this workspace."
        tone="loading"
      />
    );
  }

  if (decision.status === 'unauthorized') {
    return (
      <AdminStateScreen
        eyebrow="Redirecting"
        title="Administrator approval required"
        description="Your account is signed in, but it is not approved for CMS access yet."
        tone="warning"
      />
    );
  }

  return children;
}
