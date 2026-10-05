import { MAX_DISPLAY_BYTES, sniffImageType, readDimensions } from './upload.js';

export function validateRotation(current, rotated) {
  if (!rotated?.length || rotated.length > MAX_DISPLAY_BYTES || sniffImageType(rotated) !== 'jpeg') return { ok: false, error: 'Rotated photo must be a JPEG under 6 MB.' };
  const before = readDimensions(current, sniffImageType(current));
  const after = readDimensions(rotated, 'jpeg');
  if (!before || !after || after.width !== before.height || after.height !== before.width) return { ok: false, error: 'Rotation must preserve the photo dimensions and turn it 90 degrees.' };
  return { ok: true, dimensions: after };
}
