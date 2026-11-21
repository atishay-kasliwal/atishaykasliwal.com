import * as THREE from 'three';
import { makeRng } from './rng';
import type { QrMatrix } from './qr';
import type { Palette } from './palette';

const COUNT = 90;

/**
 * This site's addition: leaves that break off the crown itself (`from`, the canopy's leaf
 * positions), leaf-sized and fluttering, and shrink away as they land.
 */
export interface FallingLeaves {
  count: number;
  /** Size relative to the original motes. */
  size: number;
  from: THREE.Vector3[];
}

export interface Motes {
  points: THREE.InstancedMesh;
  update: (dt: number, time: number, visibility: number) => void;
  applyPalette: (p: Palette) => void;
  dispose: () => void;
}

/** Drifting petals/leaves that fall through the canopy while the tree is up. */
export function buildMotes(qr: QrMatrix, palette: Palette, leaves?: FallingLeaves): Motes {
  const COUNT_ = leaves?.count ?? COUNT;
  const rng = makeRng(0xfa11);
  const spread = qr.plot * 0.5;
  const ceiling = qr.plot * 0.72;
  const size = leaves?.size ?? 1;
  const from = leaves?.from.length ? leaves.from : null;

  const geo = new THREE.BoxGeometry(0.34 * size, 0.1 * size, 0.26 * size);
  const mat = new THREE.MeshLambertMaterial({ transparent: true });
  const points = new THREE.InstancedMesh(geo, mat, COUNT_);
  points.frustumCulled = false;

  const state = new Float32Array(COUNT_ * 6); // x, y, z, fallSpeed, swirl, phase

  // Where a leaf starts: a random leaf of the crown, or anywhere above the plot.
  const spawn = (o: number, anyHeight: boolean) => {
    if (from) {
      const p = from[Math.floor(rng() * from.length)];
      state[o] = p.x;
      state[o + 1] = anyHeight ? 0.2 + rng() * (p.y - 0.2) : p.y;
      state[o + 2] = p.z;
    } else {
      state[o] = (rng() - 0.5) * spread * 1.6;
      state[o + 1] = anyHeight ? rng() * ceiling : ceiling;
      state[o + 2] = (rng() - 0.5) * spread * 1.6;
    }
  };

  for (let i = 0; i < COUNT_; i++) {
    spawn(i * 6, true);
    state[i * 6 + 3] = 0.8 + rng() * 1.5;
    state[i * 6 + 4] = 0.3 + rng() * 0.9;
    state[i * 6 + 5] = rng() * Math.PI * 2;
  }

  const applyPalette = (p: Palette) => {
    const rngC = makeRng(0xbeef);
    const pool = p.leaf.map((c) => new THREE.Color(c));
    for (let i = 0; i < COUNT_; i++) {
      points.setColorAt(i, pool[Math.floor(rngC() * pool.length)]);
    }
    if (points.instanceColor) points.instanceColor.needsUpdate = true;
  };

  const m = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const euler = new THREE.Euler();

  const update = (dt: number, time: number, visibility: number) => {
    mat.opacity = visibility;
    points.visible = visibility > 0.02;
    if (!points.visible) return;

    for (let i = 0; i < COUNT_; i++) {
      const o = i * 6;
      state[o + 1] -= state[o + 3] * dt;
      if (state[o + 1] < 0.2) spawn(o, false);

      const swirl = state[o + 4];
      pos.set(
        state[o] + Math.sin(time * swirl + state[o + 5]) * 0.9,
        state[o + 1],
        state[o + 2] + Math.cos(time * swirl * 0.8 + state[o + 5]) * 0.9,
      );
      if (from) {
        // Rock side to side like a falling leaf rather than tumbling, and shrink away on landing.
        euler.set(Math.sin(time * swirl * 2.4 + state[o + 5]) * 0.8, time * swirl * 0.6, Math.cos(time * swirl * 2 + state[o + 5]) * 0.5);
        scl.setScalar(Math.min(1, (state[o + 1] - 0.2) / 1.2));
      } else {
        euler.set(time * swirl, time * swirl * 0.7, state[o + 5]);
        scl.setScalar(1);
      }
      quat.setFromEuler(euler);
      m.compose(pos, quat, scl);
      points.setMatrixAt(i, m);
    }
    points.instanceMatrix.needsUpdate = true;
  };

  applyPalette(palette);

  return {
    points,
    update,
    applyPalette,
    dispose: () => {
      geo.dispose();
      mat.dispose();
    },
  };
}
