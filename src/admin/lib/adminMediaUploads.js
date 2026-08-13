import { getDownloadURL, uploadBytes } from 'firebase/storage';
import {
  CMS_ALLOWED_UPLOAD_TYPES,
  CMS_MAX_UPLOAD_BYTES,
  buildCmsStoragePath,
  getCmsStorageRef,
} from '../../lib/firebase/storage.js';
import { slugify } from './adminUtils.js';

const MIME_EXTENSION_MAP = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

const CMS_UPLOAD_COLLECTION_MAP = {
  cms_posts: 'posts',
  cms_projects: 'projects',
  cms_photos: 'photos',
  cms_testimonials: 'testimonials',
  cms_journey_entries: 'journey',
  cms_movies: 'movies',
  cms_tv_series: 'tv',
  cms_music_entries: 'music',
  cms_music_collections: 'music',
  cms_media: 'media',
};

function resolveUniqueSuffix(now) {
  const time = now.getTime().toString(36);
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${time}-${random}`;
}

function extractFileExtension(fileName, contentType) {
  const fromName = String(fileName || '').trim().match(/\.([a-zA-Z0-9]+)$/)?.[1];
  if (fromName) return fromName.toLowerCase();
  return MIME_EXTENSION_MAP[contentType] || 'bin';
}

async function readImageDimensions(file) {
  if (
    typeof window === 'undefined' ||
    typeof Image === 'undefined' ||
    typeof URL === 'undefined' ||
    typeof URL.createObjectURL !== 'function'
  ) {
    return {};
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    function cleanup() {
      URL.revokeObjectURL(objectUrl);
    }

    image.onload = () => {
      resolve({
        width: image.naturalWidth || undefined,
        height: image.naturalHeight || undefined,
      });
      cleanup();
    };

    image.onerror = () => {
      resolve({});
      cleanup();
    };

    image.src = objectUrl;
  });
}

export function resolveCmsUploadCollectionName(collectionName) {
  return CMS_UPLOAD_COLLECTION_MAP[collectionName] || 'media';
}

export function getAdminImageUploadAccept() {
  return CMS_ALLOWED_UPLOAD_TYPES.filter((type) => type.startsWith('image/')).join(',');
}

export function createUploadedMediaTitle(fileName) {
  const withoutExtension = String(fileName || 'Untitled asset').replace(/\.[^.]+$/, '').trim();
  if (!withoutExtension) return 'Untitled asset';
  return withoutExtension.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function buildUploadedMediaDocument({
  file,
  downloadUrl,
  storagePath,
  now = new Date(),
  usage = '',
  alt = '',
  width,
  height,
  id,
  slug,
  title,
}) {
  const extension = extractFileExtension(file?.name, file?.type);
  const assetTitle = title || createUploadedMediaTitle(file?.name);
  const safeSlug = slug || `${slugify(assetTitle) || 'asset'}-${resolveUniqueSuffix(now)}`;
  const safeId = id || `media-${safeSlug}`;

  return {
    id: safeId,
    slug: safeSlug,
    title: assetTitle,
    status: 'published',
    visibility: 'public',
    kind: String(file?.type || '').startsWith('video/') ? 'video' : 'image',
    storagePath,
    src: downloadUrl,
    alt: alt || '',
    usage,
    fileType: extension.toUpperCase(),
    contentType: file?.type || '',
    sizeBytes: Number(file?.size || 0),
    width: Number.isFinite(width) ? width : null,
    height: Number.isFinite(height) ? height : null,
    publishedAt: now.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export async function uploadAdminMediaFile({
  file,
  storageCollection = 'media',
  usage = '',
  alt = '',
}) {
  if (!file) {
    throw new Error('Choose an image before uploading.');
  }

  if (!CMS_ALLOWED_UPLOAD_TYPES.includes(file.type)) {
    const error = new Error('Unsupported file type. Use JPG, PNG, WEBP, GIF, MP4, or WEBM.');
    error.code = 'storage/invalid-content-type';
    throw error;
  }

  if (file.size > CMS_MAX_UPLOAD_BYTES) {
    const error = new Error('This file is too large. Keep uploads under 25 MB.');
    error.code = 'storage/file-too-large';
    throw error;
  }

  const now = new Date();
  const title = createUploadedMediaTitle(file.name);
  const baseSlug = slugify(title) || 'asset';
  const suffix = resolveUniqueSuffix(now);
  const extension = extractFileExtension(file.name, file.type);
  const uniqueFileName = `${baseSlug}-${suffix}.${extension}`;
  const storagePath = buildCmsStoragePath(storageCollection, uniqueFileName, now);
  const storageRef = getCmsStorageRef(storagePath);

  await uploadBytes(storageRef, file, {
    contentType: file.type,
    cacheControl: 'public,max-age=31536000,immutable',
  });

  const downloadUrl = await getDownloadURL(storageRef);
  const dimensions = file.type.startsWith('image/')
    ? await readImageDimensions(file)
    : {};

  return buildUploadedMediaDocument({
    file,
    downloadUrl,
    storagePath,
    now,
    usage,
    alt,
    width: dimensions.width,
    height: dimensions.height,
    slug: `${baseSlug}-${suffix}`,
    id: `media-${baseSlug}-${suffix}`,
    title,
  });
}

export function toFriendlyMediaUploadError(error) {
  const code = error?.code || '';

  switch (code) {
    case 'storage/unauthorized':
      return 'This admin account is not allowed to upload to Firebase Storage.';
    case 'storage/canceled':
      return 'The upload was canceled before it finished.';
    case 'storage/retry-limit-exceeded':
      return 'The upload timed out. Please try again.';
    case 'storage/file-too-large':
    case 'storage/invalid-content-type':
      return error.message;
    default:
      return error?.message || 'The upload failed. Please try again.';
  }
}
