import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminStateScreen from '../components/AdminStateScreen.jsx';
import { useAdminAuth } from '../auth/AdminAuthProvider.jsx';
import { AdminButton } from '../components/AdminPrimitives.jsx';

const REASON_COPY = {
  not_allowlisted:
    'This signed-in account is not approved for the Atishay CMS workspace.',
  missing_admin_claim:
    'This account is locally allowlisted, but Firebase still has not granted the required admin claim.',
  unauthorized: 'This account does not have access to the private editorial workspace.',
};

export default function AdminUnauthorizedPage() {
  const auth = useAdminAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason') || auth.reason || 'unauthorized';
  const next = searchParams.get('next') || '/admin';

  return (
    <AdminStateScreen
      eyebrow="Access restricted"
      title="Administrator access is still blocked"
      description={REASON_COPY[reason] || REASON_COPY.unauthorized}
      tone="warning"
      actions={(
        <>
          <AdminButton tone="primary" onClick={() => navigate(`/admin/sign-in?next=${encodeURIComponent(next)}`, { replace: true })}>
            Try another account
          </AdminButton>
          <AdminButton tone="ghost" onClick={auth.signOut}>
            Sign out
          </AdminButton>
          {!auth.hasClaim ? (
            <AdminButton tone="ghost" onClick={auth.refreshClaims}>
              Refresh claims
            </AdminButton>
          ) : null}
        </>
      )}
    />
  );
}
