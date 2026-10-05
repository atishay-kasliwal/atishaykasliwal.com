import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { validateRotation } from '../../src/photography-core/rotation.js';
import { MAX_DISPLAY_BYTES } from '../../src/photography-core/upload.js';

test('rotated display swaps dimensions without resizing', async () => {
  const original = await sharp({create:{width:80,height:40,channels:3,background:'#337799'}}).jpeg().toBuffer();
  const rotated = await sharp(original).rotate(90).jpeg().toBuffer();
  assert.deepEqual(validateRotation(original,rotated),{ok:true,dimensions:{width:40,height:80}});
  assert.equal(validateRotation(original,original).ok,false);
  const resized=await sharp(original).resize(20,40).jpeg().toBuffer();
  assert.equal(validateRotation(original,resized).ok,false);
});
test('rotation rejects non-images and oversized output', () => {
  assert.equal(validateRotation(new Uint8Array(),new Uint8Array([1,2,3])).ok,false);
  assert.equal(validateRotation(new Uint8Array(),new Uint8Array(MAX_DISPLAY_BYTES+1)).ok,false);
});
