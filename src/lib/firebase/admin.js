import { getAdminAllowedEmails, getAdminUsername, shouldRequireAdminClaim } from './env.js';

export function normalizeAdminEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function normalizeAdminUsername(username) {
  return String(username || '').trim().toLowerCase();
}

export function isConfiguredAdminUsername(username) {
  return normalizeAdminUsername(username) === normalizeAdminUsername(getAdminUsername());
}

export function isAdminEmailAllowed(email) {
  const allowed = new Set(getAdminAllowedEmails());
  return allowed.has(normalizeAdminEmail(email));
}

export function hasAdminClaim(tokenResult) {
  return tokenResult?.claims?.admin === true;
}

export function buildAdminNextPath(locationLike) {
  const pathname = locationLike?.pathname || '/admin';
  const search = locationLike?.search || '';
  const hash = locationLike?.hash || '';
  return `${pathname}${search}${hash}`;
}

export function toFriendlyAuthError(error) {
  const code = error?.code || '';

  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was closed before it finished.';
    case 'auth/popup-blocked':
      return 'The browser blocked the Google sign-in popup. Allow popups for this site and try again.';
    case 'auth/cancelled-popup-request':
      return 'Another sign-in window is already open.';
    case 'auth/invalid-admin-username':
      return 'That username is not allowed for this admin workspace.';
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'The username or password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many sign-in attempts were made. Please wait a moment and try again.';
    case 'auth/weak-password':
      return 'Use a stronger password with at least 8 characters.';
    case 'auth/requires-recent-login':
      return 'Please sign in again before changing the password.';
    case 'auth/no-current-user':
      return 'You need to be signed in before changing the password.';
    default:
      return error?.message || 'Authentication failed. Please try again.';
  }
}

export async function resolveAdminSession(user) {
  if (!user) {
    return {
      status: 'signed_out',
      authorized: false,
      allowlisted: false,
      hasClaim: false,
      user: null,
      tokenResult: null,
      reason: 'signed_out',
      email: '',
    };
  }

  const tokenResult = await user.getIdTokenResult();
  const email = normalizeAdminEmail(user.email);
  const allowlisted = isAdminEmailAllowed(email);
  const hasClaim = hasAdminClaim(tokenResult);
  const authorized = allowlisted && (hasClaim || !shouldRequireAdminClaim());

  return {
    status: authorized ? 'authorized' : 'unauthorized',
    authorized,
    allowlisted,
    hasClaim,
    user,
    tokenResult,
    reason:
      !allowlisted
        ? 'not_allowlisted'
        : !hasClaim && shouldRequireAdminClaim()
          ? 'missing_admin_claim'
          : '',
    email,
    username: getAdminUsername(),
  };
}

export function resolveAdminRouteDecision(authState, locationLike) {
  if (authState.loading) {
    return { status: 'loading', redirectTo: null, reason: '' };
  }

  if (authState.configError) {
    return { status: 'config_error', redirectTo: null, reason: 'config_error' };
  }

  if (!authState.user) {
    const next = encodeURIComponent(buildAdminNextPath(locationLike));
    return {
      status: 'signed_out',
      redirectTo: `/admin/sign-in?next=${next}`,
      reason: 'signed_out',
    };
  }

  if (!authState.authorized) {
    const next = encodeURIComponent(buildAdminNextPath(locationLike));
    const reason = encodeURIComponent(authState.reason || 'unauthorized');
    return {
      status: 'unauthorized',
      redirectTo: `/admin/unauthorized?next=${next}&reason=${reason}`,
      reason: authState.reason || 'unauthorized',
    };
  }

  return { status: 'authorized', redirectTo: null, reason: '' };
}
