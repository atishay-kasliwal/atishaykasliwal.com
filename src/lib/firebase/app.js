import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getFirebaseClientConfig,
  getMissingFirebaseKeys,
  hasFirebaseClientConfig,
} from './env.js';

let configWarningIssued = false;

export function getFirebaseApp() {
  if (!hasFirebaseClientConfig()) {
    if (!configWarningIssued && typeof window !== 'undefined') {
      configWarningIssued = true;
      console.warn(
        `[firebase] Missing client configuration keys: ${getMissingFirebaseKeys().join(', ')}`
      );
    }
    return null;
  }

  return getApps().length > 0 ? getApp() : initializeApp(getFirebaseClientConfig());
}

export function requireFirebaseApp() {
  const app = getFirebaseApp();
  if (!app) {
    throw new Error('Firebase client configuration is incomplete.');
  }
  return app;
}
