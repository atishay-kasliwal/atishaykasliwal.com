const FIREBASE_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const readEnv = (key) => {
  const value = import.meta.env[key];
  return typeof value === 'string' ? value.trim() : '';
};

export function getFirebaseClientConfig() {
  return {
    apiKey: readEnv('VITE_FIREBASE_API_KEY'),
    authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: readEnv('VITE_FIREBASE_APP_ID'),
  };
}

export function hasFirebaseClientConfig() {
  return FIREBASE_KEYS.every((key) => Boolean(readEnv(key)));
}

export function getMissingFirebaseKeys() {
  return FIREBASE_KEYS.filter((key) => !readEnv(key));
}

export function getAdminAllowedEmails() {
  const explicit = readEnv('VITE_ADMIN_ALLOWED_EMAILS')
    .split(/[,\n]/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (explicit.length > 0) return explicit;

  const authEmail = getAdminAuthEmail();
  return authEmail ? [authEmail] : [];
}

export function getAdminUsername() {
  return readEnv('VITE_ADMIN_USERNAME') || 'katishay';
}

export function getAdminAuthEmail() {
  return (readEnv('VITE_ADMIN_AUTH_EMAIL') || 'katishay@admin.atishaykasliwal.com').toLowerCase();
}

export function shouldRequireAdminClaim() {
  return readEnv('VITE_ADMIN_REQUIRE_FIREBASE_CLAIM') === 'true';
}

export function shouldUseFirebaseEmulators() {
  return readEnv('VITE_USE_FIREBASE_EMULATORS') === 'true';
}

export function getAuthEmulatorUrl() {
  return readEnv('VITE_FIREBASE_AUTH_EMULATOR_URL') || 'http://127.0.0.1:9099';
}

export function getFirestoreEmulatorHost() {
  return readEnv('VITE_FIREBASE_FIRESTORE_EMULATOR_HOST') || '127.0.0.1';
}

export function getFirestoreEmulatorPort() {
  return Number(readEnv('VITE_FIREBASE_FIRESTORE_EMULATOR_PORT') || 8080);
}

export function getStorageEmulatorHost() {
  return readEnv('VITE_FIREBASE_STORAGE_EMULATOR_HOST') || '127.0.0.1';
}

export function getStorageEmulatorPort() {
  return Number(readEnv('VITE_FIREBASE_STORAGE_EMULATOR_PORT') || 9199);
}
