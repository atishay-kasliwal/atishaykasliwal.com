import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sniffImageType, validateUpload } from '../../src/photography-core/upload.js';
function container(brands) {
  const bytes = new Uint8Array(16 + brands.length * 4);
  new DataView(bytes.buffer).setUint32(0, bytes.length);
  bytes.set(new TextEncoder().encode('ftypmif1'), 4);
  brands.forEach((brand, i) => bytes.set(new TextEncoder().encode(brand), 16 + i * 4));
  return bytes;
}
function jpeg() {
  return new Uint8Array([255,216,255,192,0,17,8,0,100,0,200,3,1,17,0,2,17,0,3,17,0]);
}
test('HEIC detection checks compatible brands, not generic HEIF or video', () => {
  assert.equal(sniffImageType(container(['heic'])), 'heic');
  assert.equal(sniffImageType(container(['heix'])), 'heic');
  assert.equal(sniffImageType(container(['avif'])), null);
  assert.equal(sniffImageType(container(['mp42'])), null);
  assert.equal(sniffImageType(container(['mif1'])), null);
  assert.equal(sniffImageType(container(['heic']).slice(0, 19)), null);
});
test('HEIC originals require a valid display image and use its oriented dimensions', () => {
  const result = validateUpload({ original: container(['heic']), display: jpeg(), metadata: {} });
  assert.equal(result.ok, true);
  assert.equal(result.originalType, 'heic');
  assert.deepEqual(result.dimensions, { width: 200, height: 100 });
  assert.equal(validateUpload({ original: container(['heic']), display: new Uint8Array([1,2,3]), metadata: {} }).ok, false);
});

test('public dimensions follow the rotated display rather than the encoded JPEG original', () => {
  const display = jpeg();
  new DataView(display.buffer).setUint16(7, 200);
  new DataView(display.buffer).setUint16(9, 100);
  const result = validateUpload({ original: jpeg(), display, metadata: {} });
  assert.equal(result.ok, true);
  assert.deepEqual(result.dimensions, { width: 100, height: 200 });
});
