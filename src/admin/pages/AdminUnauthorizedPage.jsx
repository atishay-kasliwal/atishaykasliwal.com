import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminStateScreen from '../components/AdminStateScreen.jsx';
import { useAdminAuth } from '../auth/AdminAuthProvider.jsx';

const REASON_COPY = {
  not_allowlisted:
    'This signed-in account is not the configured admin account for the CMS workspace.',
  missing_admin_claim:
    'This account is allowlisted locally, but Firebase has not granted it the required admin custom claim yet.',
  unauthorized: 'This account is not approved for the CMS workspace yet.',
};

export default function AdminUnauthorizedPage() {
  const auth = useAdminAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason') || auth.reason || 'unauthorized';
  const next = searchParams.get('next') || '/admin';

  return (
    <AdminStateScreen
      eyebrow="Access Restricted"
      title="Administrator access is still blocked"
      description={REASON_COPY[reason] || REASON_COPY.unauthorized}
      tone="warning"
      actions={(
        <>
          <button type="button" className="admin-button" onClick={() => navigate(`/admin/sign-in?next=${encodeURIComponent(next)}`, { replace: true })}>
            Try another account
          </button>
          <button type="button" className="admin-button admin-button--ghost" onClick={auth.signOut}>
            Sign out
          </button>
          {!auth.hasClaim ? (
            <button type="button" className="admin-button admin-button--ghost" onClick={auth.refreshClaims}>
              Refresh claims
            </button>
          ) : null}
        </>
      )}
    />
  );
}
