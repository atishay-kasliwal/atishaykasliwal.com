import { connectStorageEmulator, getStorage, ref } from 'firebase/storage';
import { getFirebaseApp } from './app.js';
import {
  getStorageEmulatorHost,
  getStorageEmulatorPort,
  shouldUseFirebaseEmulators,
} from './env.js';

export const CMS_STORAGE_ROOT = 'cms';
export const CMS_ALLOWED_UPLOAD_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
];
export const CMS_MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

let storageEmulatorConnected = false;

function maybeConnectStorageEmulator(storage) {
  if (!storage || storageEmulatorConnected || !shouldUseFirebaseEmulators()) return;
  connectStorageEmulator(storage, getStorageEmulatorHost(), getStorageEmulatorPort());
  storageEmulatorConnected = true;
}

export function getFirebaseStorage() {
  const app = getFirebaseApp();
  if (!app) return null;

  const storage = getStorage(app);
  maybeConnectStorageEmulator(storage);
  return storage;
}

export function buildCmsStoragePath(collectionName, fileName, now = new Date()) {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const safeFileName = String(fileName || 'upload')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '');

  return `${CMS_STORAGE_ROOT}/${collectionName}/${year}/${month}/${safeFileName}`;
}

export function getCmsStorageRef(path) {
  const storage = getFirebaseStorage();
  if (!storage) throw new Error('Firebase Storage is not configured.');
  if (!String(path).startsWith(`${CMS_STORAGE_ROOT}/`)) {
    throw new Error(`CMS storage paths must live under "${CMS_STORAGE_ROOT}/".`);
  }
  return ref(storage, path);
}
