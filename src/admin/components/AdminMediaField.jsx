import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminWorkspace } from '../context/AdminWorkspaceProvider.jsx';
import { useAdminToast } from '../context/AdminToastProvider.jsx';
import { AdminBadge, AdminButton, AdminField, AdminInput, AdminSelect } from './AdminPrimitives.jsx';
import AdminIcon from './AdminIcon.jsx';
import {
  getAdminImageUploadAccept,
  toFriendlyMediaUploadError,
  uploadAdminMediaFile,
} from '../lib/adminMediaUploads.js';

function resolveMediaValue(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  return value.src || value.storagePath || value.mediaId || value.id || value.slug || '';
}

function resolveAsset(value, assets) {
  const normalized = resolveMediaValue(value);
  if (!normalized) return null;

  return (
    assets.find(
      (asset) =>
        asset.id === normalized ||
        asset.slug === normalized ||
        asset.src === normalized ||
        asset.storagePath === normalized
    ) || null
  );
}

export default function AdminMediaField({
  field,
  value,
  onChange,
  error,
  uploadCollectionName = 'media',
  uploadUsage = '',
}) {
  const workspace = useAdminWorkspace();
  const { pushToast } = useAdminToast();
  const allAssets = workspace.getCollection('cms_media');
  const assetKind = field.mediaKind || 'image';
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const assets = useMemo(
    () =>
      allAssets.filter((asset) => {
        if (!assetKind) return true;
        return asset.kind === assetKind;
      }),
    [allAssets, assetKind]
  );

  const rawValue = resolveMediaValue(value);
  const selectedAsset = useMemo(() => resolveAsset(value, assets), [assets, value]);
  const previewSrc = selectedAsset?.src || rawValue;

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const uploadedAsset = await uploadAdminMediaFile({
        file,
        storageCollection: uploadCollectionName,
        usage: uploadUsage || field.label,
      });

      const result = workspace.upsertCollectionDocument('cms_media', uploadedAsset, {
        notifySyncError: true,
      });
      onChange(field.key, uploadedAsset.src);

      pushToast({
        tone: result.ok ? 'success' : 'warning',
        title: 'Image uploaded',
        description: result.ok
          ? `${uploadedAsset.title} is now available in the media library.`
          : `${uploadedAsset.title} uploaded, but its metadata still needs attention.`,
      });
    } catch (uploadError) {
      pushToast({
        tone: 'danger',
        title: 'Upload failed',
        description: toFriendlyMediaUploadError(uploadError),
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }

  return (
    <AdminField
      key={field.key}
      label={field.label}
      error={error}
      hint={field.hint || 'Paste an image path, upload a new image, or pick one from the media library.'}
    >
      <div className="admin-mediaField">
        <input
          ref={fileInputRef}
          type="file"
          accept={getAdminImageUploadAccept()}
          hidden
          onChange={handleFileUpload}
        />

        <div className="admin-mediaField__preview">
          {previewSrc ? (
            <img src={previewSrc} alt={field.label} />
          ) : (
            <span className="admin-mediaField__placeholder">
              <AdminIcon name="image" size={18} />
              <span>No image selected</span>
            </span>
          )}
        </div>

        <div className="admin-mediaField__controls">
          <AdminInput
            type="text"
            value={rawValue}
            onChange={(event) => onChange(field.key, event.target.value)}
            placeholder={field.placeholder || '/music/album-cover.webp'}
          />

          <div className="admin-mediaField__actions">
            <AdminSelect
              value={selectedAsset?.src || ''}
              onChange={(event) => onChange(field.key, event.target.value)}
            >
              <option value="">Choose from media library</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.src || asset.storagePath || asset.id}>
                  {asset.title}
                  {asset.usage ? ` · ${asset.usage}` : ''}
                </option>
              ))}
            </AdminSelect>

            <AdminButton
              tone="ghost"
              size="sm"
              icon="plus"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? 'Uploading…' : 'Upload image'}
            </AdminButton>

            <AdminButton as={Link} to="/admin/media" tone="ghost" size="sm" icon="image">
              Media library
            </AdminButton>

            {rawValue ? (
              <AdminButton tone="ghost" size="sm" onClick={() => onChange(field.key, '')}>
                Clear
              </AdminButton>
            ) : null}
          </div>

          <div className="admin-mediaField__meta">
            {selectedAsset ? (
              <>
                <AdminBadge tone="success">Library asset</AdminBadge>
                <span>
                  {selectedAsset.usage || selectedAsset.fileType || selectedAsset.kind}
                </span>
              </>
            ) : rawValue ? (
              <>
                <AdminBadge tone="neutral">Custom path</AdminBadge>
                <span>{rawValue}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </AdminField>
  );
}
