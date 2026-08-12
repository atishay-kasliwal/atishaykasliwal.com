import { collection, connectFirestoreEmulator, doc, getFirestore } from 'firebase/firestore';
import { CMS_COLLECTIONS } from '../validation/cmsSchemas.js';
import { getFirebaseApp } from './app.js';
import {
  getFirestoreEmulatorHost,
  getFirestoreEmulatorPort,
  shouldUseFirebaseEmulators,
} from './env.js';

let firestoreEmulatorConnected = false;

function maybeConnectFirestoreEmulator(db) {
  if (!db || firestoreEmulatorConnected || !shouldUseFirebaseEmulators()) return;
  connectFirestoreEmulator(db, getFirestoreEmulatorHost(), getFirestoreEmulatorPort());
  firestoreEmulatorConnected = true;
}

export function getFirestoreDb() {
  const app = getFirebaseApp();
  if (!app) return null;

  const db = getFirestore(app);
  maybeConnectFirestoreEmulator(db);
  return db;
}

function ensureCmsCollection(name) {
  if (!CMS_COLLECTIONS.includes(name)) {
    throw new Error(`Unsupported CMS collection "${name}".`);
  }
}

export function getCmsCollectionRef(name) {
  ensureCmsCollection(name);
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore is not configured.');
  return collection(db, name);
}

export function getCmsDocumentRef(collectionName, id) {
  ensureCmsCollection(collectionName);
  const db = getFirestoreDb();
  if (!db) throw new Error('Firestore is not configured.');
  return doc(db, collectionName, id);
}
