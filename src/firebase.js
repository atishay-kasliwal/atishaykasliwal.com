import { getFirestoreDb } from './lib/firebase/firestore.js';

/*
 * Compatibility export for the existing FOMC dashboard.
 *
 * New CMS/admin code uses the split Firebase modules in src/lib/firebase/*.
 * This file stays as the stable import path that the dashboard already uses so
 * its Firestore reads remain unchanged.
 */
export const db = getFirestoreDb();
