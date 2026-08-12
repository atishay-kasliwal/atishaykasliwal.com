import {
  EmailAuthProvider,
  GoogleAuthProvider,
  connectAuthEmulator,
  getAuth,
  onIdTokenChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { getFirebaseApp } from './app.js';
import { getAdminAuthEmail, getAdminUsername, getAuthEmulatorUrl, shouldUseFirebaseEmulators } from './env.js';

let authEmulatorConnected = false;
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

function maybeConnectAuthEmulator(auth) {
  if (!auth || authEmulatorConnected || !shouldUseFirebaseEmulators()) return;
  connectAuthEmulator(auth, getAuthEmulatorUrl(), { disableWarnings: true });
  authEmulatorConnected = true;
}

export function getFirebaseAuth() {
  const app = getFirebaseApp();
  if (!app) return null;

  const auth = getAuth(app);
  maybeConnectAuthEmulator(auth);
  return auth;
}

export function subscribeToAdminAuth(callback) {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onIdTokenChanged(auth, callback);
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase Auth is not configured for this environment.');
  }

  return signInWithPopup(auth, provider);
}

export async function signInWithAdminPassword({ username, password }) {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase Auth is not configured for this environment.');
  }

  const normalizedUsername = String(username || '').trim().toLowerCase();
  if (normalizedUsername !== getAdminUsername().toLowerCase()) {
    const error = new Error('That username is not allowed for this admin workspace.');
    error.code = 'auth/invalid-admin-username';
    throw error;
  }

  return signInWithEmailAndPassword(auth, getAdminAuthEmail(), password);
}

export async function changeAdminPassword({ currentPassword, nextPassword }) {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) {
    const error = new Error('You need to be signed in before changing the password.');
    error.code = 'auth/no-current-user';
    throw error;
  }

  const credential = EmailAuthProvider.credential(
    auth.currentUser.email || getAdminAuthEmail(),
    currentPassword
  );

  await reauthenticateWithCredential(auth.currentUser, credential);
  await updatePassword(auth.currentUser, nextPassword);
}

export async function signOutAdmin() {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}
