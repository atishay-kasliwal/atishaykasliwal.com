import * as THREE from 'three';
import { buildQr, moduleToWorld, QUIET_ZONE, type QrMatrix } from './qr';
import { CELL, HEDGE_RING } from './constants';
import { makeRng } from './rng';
import type { Palette } from './palette';

export interface PlotMeshes {
  group: THREE.Group;
  tiles: THREE.InstancedMesh;
  hedge: THREE.InstancedMesh;
  garden: Garden;
  slab: THREE.Mesh;
  applyPalette: (p: Palette) => void;
}

/**
 * The ground plot *is* the code: every module is a tile, dark ones sit slightly
 * proud so the pattern reads even before the canopy settles into it.
 */
export function buildPlot(qr: QrMatrix, palette: Palette): PlotMeshes {
  const group = new THREE.Group();
  const plotUnits = qr.plot * CELL;
  const rimUnits = plotUnits + HEDGE_RING * 2 * CELL;

  // ---- base slab -------------------------------------------------------
  const slabGeo = new THREE.BoxGeometry(rimUnits, 0.9, rimUnits);
  const slabMat = new THREE.MeshLambertMaterial({ color: palette.slab });
  const slab = new THREE.Mesh(slabGeo, slabMat);
  slab.position.y = -0.45;
  slab.receiveShadow = true;
  group.add(slab);

  // ---- module tiles ----------------------------------------------------
  const tileGeo = new THREE.BoxGeometry(CELL, 0.3, CELL);
  // Colour comes from instanceColor alone; setting vertexColors would define
  // USE_COLOR and multiply by a missing per-vertex attribute (i.e. black).
  const tileMat = new THREE.MeshLambertMaterial();
  const total = qr.plot * qr.plot;
  const tiles = new THREE.InstancedMesh(tileGeo, tileMat, total);
  tiles.receiveShadow = true;
  tiles.instanceMatrix.setUsage(THREE.StaticDrawUsage);

  const m = new THREE.Matrix4();
  const darkFlags: boolean[] = new Array(total);
  let i = 0;

  for (let py = 0; py < qr.plot; py++) {
    for (let px = 0; px < qr.plot; px++) {
      const qx = px - QUIET_ZONE;
      const qy = py - QUIET_ZONE;
      const inside = qx >= 0 && qy >= 0 && qx < qr.size && qy < qr.size;
      const dark = inside ? qr.dark[qy * qr.size + qx] : false;
      darkFlags[i] = dark;

      const { x, z } = moduleToWorld(px, py, qr.plot, CELL);
      if (dark) {
        // Site change: a dark module is a clipped hedge, its top at 0.28 so the settled leaves
        // (0 to MODULE_HEIGHT) still cover it in the code view. Inset a little, so rows read as
        // hedges planted module by module.
        m.compose(tmpPos.set(x, 0.28 - (0.3 * HEDGE_TILE_HEIGHT) / 2, z), tmpQuat, tmpScale.set(HEDGE_TILE_INSET, HEDGE_TILE_HEIGHT, HEDGE_TILE_INSET));
      } else {
        m.makeTranslation(x, -0.14, z);
      }
      tiles.setMatrixAt(i, m);
      i++;
    }
  }
  tiles.instanceMatrix.needsUpdate = true;
  group.add(tiles);

  // ---- hedge rim -------------------------------------------------------
  const hedge = buildHedge(plotUnits, rimUnits, palette);
  group.add(hedge);

  // ---- garden border (site change) --------------------------------------
  const garden = buildGarden(plotUnits, rimUnits);
  group.add(garden.flowers, garden.shrubs, garden.stones);

  // Each hedge a shade lighter or darker than its neighbours, fixed per module.
  const shadeRng = makeRng(0x9a7de2);
  const shades = Array.from({ length: total }, () => 0.86 + shadeRng() * 0.24);
  const dark = new THREE.Color();
  const light = new THREE.Color();
  const applyPalette = (p: Palette) => {
    slabMat.color.set(p.slab);
    dark.set(p.moduleDark);
    light.set(p.moduleLight);
    const shaded = new THREE.Color();
    for (let k = 0; k < total; k++) tiles.setColorAt(k, darkFlags[k] ? shaded.copy(dark).multiplyScalar(shades[k]) : light);
    if (tiles.instanceColor) tiles.instanceColor.needsUpdate = true;
    paintHedge(hedge, p);
    paintGarden(garden, p);
  };

  applyPalette(palette);

  return { group, tiles, hedge, garden, slab, applyPalette };
}

const HEDGE_TILE_HEIGHT = 1.45;
const HEDGE_TILE_INSET = 0.94;
const tmpPos = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpScale = new THREE.Vector3();

const HEDGE_BLADES = 1100;

/**
 * Grass is confined to the rim *outside* the quiet zone — the four modules of
 * clear margin a scanner needs stay genuinely clear.
 */
function buildHedge(plotUnits: number, rimUnits: number, palette: Palette) {
  const rng = makeRng(0x5eed1eaf);
  const geo = new THREE.BoxGeometry(0.16, 1, 0.16);
  geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshLambertMaterial();
  const mesh = new THREE.InstancedMesh(geo, mat, HEDGE_BLADES);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const inner = plotUnits / 2;
  const outer = rimUnits / 2;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();

  for (let k = 0; k < HEDGE_BLADES; k++) {
    const side = k % 4;
    const along = rng() * rimUnits - outer;
    const depth = inner + rng() * (outer - inner);

    if (side === 0) pos.set(along, -0.28, -depth);
    else if (side === 1) pos.set(along, -0.28, depth);
    else if (side === 2) pos.set(-depth, -0.28, along);
    else pos.set(depth, -0.28, along);

    e.set((rng() - 0.5) * 0.5, rng() * Math.PI, (rng() - 0.5) * 0.5);
    q.setFromEuler(e);
    scl.set(1, 0.7 + rng() * 1.1, 1);
    m.compose(pos, q, scl);
    mesh.setMatrixAt(k, m);
  }
  mesh.instanceMatrix.needsUpdate = true;
  paintHedge(mesh, palette);
  return mesh;
}

function paintHedge(mesh: THREE.InstancedMesh, palette: Palette) {
  const rng = makeRng(0xc0ffee);
  const colors = palette.hedge.map((c) => new THREE.Color(c));
  for (let k = 0; k < mesh.count; k++) {
    mesh.setColorAt(k, colors[Math.floor(rng() * colors.length)]);
  }
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

/*
 * Site change: the rim outside the quiet zone becomes a garden bed. Flowers take the canopy's
 * colours (so they follow the theme), shrubs the grass colours, stones stay grey. All of it sits in
 * the rim, outside the four clear modules a scanner needs, and none of it changes the plot's size.
 */
export interface Garden {
  flowers: THREE.InstancedMesh;
  shrubs: THREE.InstancedMesh;
  stones: THREE.InstancedMesh;
}

const FLOWERS = 340;
const SHRUB_CLUSTERS = 12; // four corners, two more on each side
const SHRUB_PARTS = 7;
const STONES = 26;

function buildGarden(plotUnits: number, rimUnits: number): Garden {
  const rng = makeRng(0x6a7de4);
  const inner = plotUnits / 2;
  const outer = rimUnits / 2;
  const band = outer - inner;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();

  // A point in the rim: `side` 0–3, `along` from one end to the other, `depth` 0 (plot edge) to 1.
  const inRim = (side: number, along: number, depth: number, y: number) => {
    const d = inner + 0.15 + depth * (band - 0.3);
    if (side === 0) return pos.set(along, y, -d);
    if (side === 1) return pos.set(along, y, d);
    if (side === 2) return pos.set(-d, y, along);
    return pos.set(d, y, along);
  };

  // Flowers: small blooms on short stems, in loose drifts along each side.
  const flowerGeo = new THREE.BoxGeometry(0.42, 0.32, 0.42);
  flowerGeo.translate(0, 0.16, 0);
  const flowers = new THREE.InstancedMesh(flowerGeo, new THREE.MeshLambertMaterial(), FLOWERS);
  flowers.castShadow = true;
  for (let k = 0; k < FLOWERS; k++) {
    const side = k % 4;
    const along = (rng() * 2 - 1) * (inner - 1.5);
    e.set((rng() - 0.5) * 0.4, rng() * Math.PI, (rng() - 0.5) * 0.4);
    q.setFromEuler(e);
    const s = 0.7 + rng() * 0.7;
    m.compose(inRim(side, along, rng(), 0.05 + rng() * 0.35), q, scl.set(s, s, s));
    flowers.setMatrixAt(k, m);
  }
  flowers.instanceMatrix.needsUpdate = true;

  // Shrubs: rounded clumps of a few boxes, at the corners and twice along each side.
  const shrubGeo = new THREE.BoxGeometry(1, 1, 1);
  shrubGeo.translate(0, 0.5, 0);
  const shrubs = new THREE.InstancedMesh(shrubGeo, new THREE.MeshLambertMaterial(), SHRUB_CLUSTERS * SHRUB_PARTS);
  shrubs.castShadow = true;
  shrubs.receiveShadow = true;
  const centres: Array<[number, number]> = [[-outer + band / 2, -outer + band / 2], [outer - band / 2, -outer + band / 2], [-outer + band / 2, outer - band / 2], [outer - band / 2, outer - band / 2]];
  for (let side = 0; side < 4; side++) {
    for (const t of [-0.45, 0.45]) {
      const p = inRim(side, t * inner, 0.5, 0).clone();
      centres.push([p.x, p.z]);
    }
  }
  let n = 0;
  for (const [cx, cz] of centres) {
    const corner = Math.abs(cx) > inner && Math.abs(cz) > inner;
    const size = corner ? 1.9 : 1.25;
    for (let j = 0; j < SHRUB_PARTS; j++) {
      const a = (j / SHRUB_PARTS) * Math.PI * 2 + rng();
      const r = j === 0 ? 0 : size * (0.25 + rng() * 0.2);
      const s = size * (j === 0 ? 0.85 : 0.5 + rng() * 0.25);
      e.set(0, rng() * Math.PI, 0);
      q.setFromEuler(e);
      pos.set(cx + Math.cos(a) * r, -0.3, cz + Math.sin(a) * r);
      m.compose(pos, q, scl.set(s, s * (0.8 + rng() * 0.5), s));
      shrubs.setMatrixAt(n++, m);
    }
  }
  shrubs.instanceMatrix.needsUpdate = true;

  // Stones: a few flat grey pebbles at the plot's edge.
  const stoneGeo = new THREE.BoxGeometry(0.5, 0.16, 0.38);
  const stones = new THREE.InstancedMesh(stoneGeo, new THREE.MeshLambertMaterial(), STONES);
  stones.receiveShadow = true;
  for (let k = 0; k < STONES; k++) {
    e.set(0, rng() * Math.PI, 0);
    q.setFromEuler(e);
    const s = 0.6 + rng() * 0.8;
    m.compose(inRim(k % 4, (rng() * 2 - 1) * (inner - 1), rng() * 0.35, -0.24), q, scl.set(s, 1, s));
    stones.setMatrixAt(k, m);
  }
  stones.instanceMatrix.needsUpdate = true;

  return { flowers, shrubs, stones };
}

function paintGarden(garden: Garden, palette: Palette) {
  const rng = makeRng(0xf10e25);
  const blooms = palette.leaf.map((c) => new THREE.Color(c));
  for (let k = 0; k < garden.flowers.count; k++) garden.flowers.setColorAt(k, blooms[Math.floor(rng() * blooms.length)]);
  // Shrubs a shade deeper than the grass around them.
  const leafy = palette.hedge.map((c) => new THREE.Color(c).multiplyScalar(0.72));
  for (let k = 0; k < garden.shrubs.count; k++) garden.shrubs.setColorAt(k, leafy[Math.floor(rng() * leafy.length)]);
  const stone = new THREE.Color('#8d8a82');
  const shade = new THREE.Color();
  for (let k = 0; k < garden.stones.count; k++) garden.stones.setColorAt(k, shade.copy(stone).multiplyScalar(0.8 + rng() * 0.35));
  for (const mesh of [garden.flowers, garden.shrubs, garden.stones]) if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

export { buildQr };
