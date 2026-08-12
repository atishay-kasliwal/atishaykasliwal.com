import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getAdminAllowedEmails,
  getAdminAuthEmail,
  getAdminUsername,
  hasFirebaseClientConfig,
} from '../../lib/firebase/env.js';
import { resolveAdminSession, toFriendlyAuthError } from '../../lib/firebase/admin.js';
import {
  changeAdminPassword,
  signInWithAdminPassword,
  signOutAdmin,
  subscribeToAdminAuth,
} from '../../lib/firebase/auth.js';

const AdminAuthContext = createContext(null);

const INITIAL_STATE = {
  loading: true,
  authorized: false,
  allowlisted: false,
  hasClaim: false,
  user: null,
  tokenResult: null,
  reason: '',
  error: '',
  configError: '',
  email: '',
};

export function AdminAuthProvider({ children }) {
  const [state, setState] = useState(INITIAL_STATE);

  const applySession = useCallback(async (user) => {
    if (!user) {
      setState((current) => ({
        ...current,
        ...INITIAL_STATE,
        loading: false,
      }));
      return;
    }

    try {
      const session = await resolveAdminSession(user);
      setState((current) => ({
        ...current,
        ...session,
        loading: false,
        error: '',
        configError: '',
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        user,
        error: toFriendlyAuthError(error),
      }));
    }
  }, []);

  useEffect(() => {
    if (!hasFirebaseClientConfig()) {
      setState((current) => ({
        ...current,
        ...INITIAL_STATE,
        loading: false,
        configError: 'Firebase client configuration is incomplete.',
      }));
      return undefined;
    }

    setState((current) => ({ ...current, loading: true }));

    const unsubscribe = subscribeToAdminAuth((user) => {
      applySession(user);
    });

    return unsubscribe;
  }, [applySession]);

  const signIn = useCallback(async ({ username, password }) => {
    if (!hasFirebaseClientConfig()) {
      setState((current) => ({
        ...current,
        loading: false,
        configError: 'Firebase client configuration is incomplete.',
      }));
      return;
    }

    setState((current) => ({ ...current, error: '', loading: true }));

    try {
      await signInWithAdminPassword({ username, password });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: toFriendlyAuthError(error),
      }));
    }
  }, []);

  const signOut = useCallback(async () => {
    setState((current) => ({ ...current, error: '', loading: true }));

    try {
      await signOutAdmin();
      setState((current) => ({
        ...current,
        ...INITIAL_STATE,
        loading: false,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: toFriendlyAuthError(error),
      }));
    }
  }, []);

  const refreshClaims = useCallback(async () => {
    if (!state.user) return;
    setState((current) => ({ ...current, loading: true, error: '' }));
    await applySession(state.user);
  }, [applySession, state.user]);

  const changePassword = useCallback(async ({ currentPassword, nextPassword }) => {
    try {
      await changeAdminPassword({ currentPassword, nextPassword });
      setState((current) => ({ ...current, error: '' }));
      return { ok: true, message: 'Password updated successfully.' };
    } catch (error) {
      const message = toFriendlyAuthError(error);
      setState((current) => ({ ...current, error: message }));
      return { ok: false, message };
    }
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      allowedEmails: getAdminAllowedEmails(),
      adminUsername: getAdminUsername(),
      adminAuthEmail: getAdminAuthEmail(),
      signIn,
      signOut,
      refreshClaims,
      changePassword,
    }),
    [changePassword, refreshClaims, signIn, signOut, state]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used inside AdminAuthProvider.');
  }
  return context;
}
