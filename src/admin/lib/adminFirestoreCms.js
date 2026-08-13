import { Timestamp, onSnapshot, setDoc } from 'firebase/firestore';
import { getCmsCollectionRef, getCmsDocumentRef } from '../../lib/firebase/firestore.js';

const TIMESTAMP_FIELDS = ['createdAt', 'updatedAt', 'publishedAt', 'archivedAt', 'deletedAt'];
const INTEGER_FIELDS = ['displayOrder', 'year', 'seasons', 'width', 'height', 'sizeBytes', 'readingTime', 'wordCount'];

function isTimestampLike(value) {
  return value && typeof value === 'object' && typeof value.toDate === 'function';
}

function toIsoString(value) {
  if (value == null || value === '') return value ?? null;
  if (isTimestampLike(value)) {
    return value.toDate().toISOString();
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : value;
  }

  return value;
}

function toTimestampValue(value) {
  if (value === undefined || value === '') return undefined;
  if (value === null) return null;
  if (isTimestampLike(value)) return value;

  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return undefined;
  return Timestamp.fromDate(parsed);
}

function toIntegerValue(value) {
  if (value === undefined || value === '') return undefined;
  if (value === null) return null;
  if (typeof value === 'number' && Number.isInteger(value)) return value;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.trunc(parsed);
}

export function deserializeCmsDocument(id, data = {}) {
  const document = {
    id,
    ...data,
  };

  TIMESTAMP_FIELDS.forEach((field) => {
    if (field in document) {
      document[field] = toIsoString(document[field]);
    }
  });

  return document;
}

export function serializeCmsDocument(document = {}) {
  const payload = {};

  Object.entries(document).forEach(([key, value]) => {
    if (key.startsWith('_')) return;

    if (TIMESTAMP_FIELDS.includes(key)) {
      const timestamp = toTimestampValue(value);
      if (timestamp !== undefined) payload[key] = timestamp;
      return;
    }

    if (INTEGER_FIELDS.includes(key)) {
      const integer = toIntegerValue(value);
      if (integer !== undefined) payload[key] = integer;
      return;
    }

    if (value !== undefined) {
      payload[key] = value;
    }
  });

  return payload;
}

export function subscribeToCmsCollection(collectionName, onValue, onError) {
  return onSnapshot(
    getCmsCollectionRef(collectionName),
    (snapshot) => {
      const documents = snapshot.docs.map((doc) => deserializeCmsDocument(doc.id, doc.data()));
      onValue(documents);
    },
    onError
  );
}

export async function writeCmsDocument(collectionName, document) {
  const payload = serializeCmsDocument(document);
  await setDoc(getCmsDocumentRef(collectionName, document.id), payload, { merge: true });
  return payload;
}
