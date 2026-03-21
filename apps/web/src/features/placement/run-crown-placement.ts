import * as THREE from "three";
import type { CrownPlacementInput, CrownPlacementResult } from "./types";

interface PlacementMeshes {
  scan: THREE.Mesh | null;
  crown: THREE.Mesh | null;
}

const placementMeshes: PlacementMeshes = { scan: null, crown: null };

export function setPlacementMeshes(meshes: Partial<PlacementMeshes>) {
  if (meshes.scan !== undefined) placementMeshes.scan = meshes.scan;
  if (meshes.crown !== undefined) placementMeshes.crown = meshes.crown;
}
export function getPlacementMeshes(): PlacementMeshes {
  return placementMeshes;
}

// ── helpers ────────────────────────────────────────────────────────────────

function getWorldVertices(mesh: THREE.Mesh, maxCount = 30000): THREE.Vector3[] {
  const pos = mesh.geometry.getAttribute("position");
  const step = Math.ceil(pos.count / maxCount);
  const verts: THREE.Vector3[] = [];
  for (let i = 0; i < pos.count; i += step) {
    const v = new THREE.Vector3().fromBufferAttribute(pos, i);
    v.applyMatrix4(mesh.matrixWorld);
    verts.push(v);
  }
  return verts;
}

function getCrownLocalZMin(crown: THREE.Mesh): number {
  const pos = crown.geometry.getAttribute("position");
  let zMin = Infinity;
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    if (z < zMin) zMin = z;
  }
  return zMin;
}

function getCrownVertsAtOrigin(
  crown: THREE.Mesh,
  maxCount = 3000,
): THREE.Vector3[] {
  const pos = crown.geometry.getAttribute("position");
  const step = Math.ceil(pos.count / maxCount);
  const verts: THREE.Vector3[] = [];
  for (let i = 0; i < pos.count; i += step) {
    verts.push(new THREE.Vector3().fromBufferAttribute(pos, i));
  }
  return verts;
}

function downsample(verts: THREE.Vector3[], max: number): THREE.Vector3[] {
  if (verts.length <= max) return verts;
  const step = Math.ceil(verts.length / max);
  return verts.filter((_, i) => i % step === 0);
}

function centroid(verts: THREE.Vector3[]): THREE.Vector3 {
  const c = new THREE.Vector3();
  for (const v of verts) c.add(v);
  return c.divideScalar(verts.length);
}

class SpatialGrid {
  private cells = new Map<string, THREE.Vector3[]>();
  constructor(
    private verts: THREE.Vector3[],
    private cellSize = 3.0,
  ) {
    for (const v of verts) {
      const k = this.key(v.x, v.y, v.z);
      if (!this.cells.has(k)) this.cells.set(k, []);
      this.cells.get(k)!.push(v);
    }
  }
  private key(x: number, y: number, z: number) {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)},${Math.floor(z / this.cellSize)}`;
  }
  nearest(p: THREE.Vector3): THREE.Vector3 | null {
    const cx = Math.floor(p.x / this.cellSize);
    const cy = Math.floor(p.y / this.cellSize);
    const cz = Math.floor(p.z / this.cellSize);
    let best: THREE.Vector3 | null = null;
    let bestD = Infinity;
    for (let dx = -2; dx <= 2; dx++)
      for (let dy = -2; dy <= 2; dy++)
        for (let dz = -2; dz <= 2; dz++) {
          const cell = this.cells.get(`${cx + dx},${cy + dy},${cz + dz}`);
          if (!cell) continue;
          for (const v of cell) {
            const d = p.distanceToSquared(v);
            if (d < bestD) {
              bestD = d;
              best = v;
            }
          }
        }
    return best;
  }
  withinXYRadius(cx: number, cy: number, r: number): THREE.Vector3[] {
    const r2 = r * r;
    const result: THREE.Vector3[] = [];
    const gcx = Math.floor(cx / this.cellSize);
    const gcy = Math.floor(cy / this.cellSize);
    const span = Math.ceil(r / this.cellSize) + 1;
    for (let dx = -span; dx <= span; dx++)
      for (let dy = -span; dy <= span; dy++)
        for (let dz = -30; dz <= 30; dz++) {
          const cell = this.cells.get(`${gcx + dx},${gcy + dy},${dz}`);
          if (!cell) continue;
          for (const v of cell) {
            if ((v.x - cx) ** 2 + (v.y - cy) ** 2 <= r2) result.push(v);
          }
        }
    return result;
  }
}

/**
 * Find the prepared stump by scanning 8 directional arch endpoints.
 *
 * From analysis of all 5 cases:
 * - The stump is always at or near an arch endpoint (XY periphery of elevated verts)
 * - Its top surface footprint best matches the crown XY dimensions
 * - Top surface = verts within 1.5mm of local peak Z
 *
 * Algorithm:
 * 1. Collect elevated verts (top 60% by Z)
 * 2. Find 8 directional XY extremes → arch endpoint candidates
 * 3. For each candidate, gather crown-sized disk, compute top surface footprint
 * 4. Score by footprint match to crown rx/ry
 * 5. Best match = stump
 */
function findStump(
  scanVerts: THREE.Vector3[],
  crownRx: number,
  crownRy: number,
  scanBox: THREE.Box3,
): {
  x: number;
  y: number;
  topSurfaceZ: number;
  peakZ: number;
  topVertCount: number;
  localRx: number;
  localRy: number;
  score: number;
  candidateIndex: number;
} {
  const spanZ = scanBox.max.z - scanBox.min.z;
  const midZ = scanBox.min.z + spanZ * 0.4; // top 60% of scan

  const elevated = scanVerts.filter((v) => v.z > midZ);
  if (elevated.length === 0) {
    return {
      x: 0,
      y: 0,
      topSurfaceZ: scanBox.max.z,
      peakZ: scanBox.max.z,
      topVertCount: 0,
      localRx: 0,
      localRy: 0,
      score: Infinity,
      candidateIndex: -1,
    };
  }

  // 8 directional extremes — covers all arch endpoint orientations
  const directions: [number, number][] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ];

  // Snap to 6mm grid to merge near-duplicates
  const GRID = 6.0;
  const seen = new Set<string>();
  const candidates: { x: number; y: number }[] = [];

  for (const [dx, dy] of directions) {
    const extreme = elevated.reduce(
      (best, v) => (v.x * dx + v.y * dy > best.x * dx + best.y * dy ? v : best),
      elevated[0],
    );
    const gx = Math.round(extreme.x / GRID) * GRID;
    const gy = Math.round(extreme.y / GRID) * GRID;
    const key = `${gx},${gy}`;
    if (!seen.has(key)) {
      seen.add(key);
      candidates.push({ x: gx, y: gy });
    }
  }

  // Disk radius = crown footprint mean radius + small margin
  const DISK_R = Math.sqrt(crownRx ** 2 + crownRy ** 2) * 0.85;
  const TOP_BAND = 1.5; // mm

  const results: {
    x: number;
    y: number;
    topSurfaceZ: number;
    peakZ: number;
    topVertCount: number;
    localRx: number;
    localRy: number;
    score: number;
  }[] = [];

  for (const { x, y } of candidates) {
    // Gather scan verts in disk around candidate
    const r2 = DISK_R * DISK_R;
    const disk = scanVerts.filter((v) => (v.x - x) ** 2 + (v.y - y) ** 2 <= r2);
    if (disk.length < 8) continue;

    let peakZ = -Infinity;
    for (const v of disk) if (v.z > peakZ) peakZ = v.z;

    // Top surface verts
    const topVerts = disk.filter((v) => v.z >= peakZ - TOP_BAND);
    if (topVerts.length < 3) continue;

    // Centroid of top surface
    const topC = centroid(topVerts);

    // XY footprint of top surface
    let xMin = Infinity,
      xMax = -Infinity;
    let yMin = Infinity,
      yMax = -Infinity;
    for (const v of topVerts) {
      if (v.x < xMin) xMin = v.x;
      if (v.x > xMax) xMax = v.x;
      if (v.y < yMin) yMin = v.y;
      if (v.y > yMax) yMax = v.y;
    }
    const localRx = (xMax - xMin) / 2;
    const localRy = (yMax - yMin) / 2;

    // Score: footprint difference (normalised)
    const rxDiff = Math.abs(localRx - crownRx) / (crownRx + 0.01);
    const ryDiff = Math.abs(localRy - crownRy) / (crownRy + 0.01);
    const score = rxDiff + ryDiff;

    results.push({
      x: topC.x,
      y: topC.y,
      topSurfaceZ: topC.z,
      peakZ,
      topVertCount: topVerts.length,
      localRx,
      localRy,
      score,
    });
  }

  if (results.length === 0) {
    // Fallback: use overall peak Z
    let peakVert = scanVerts[0];
    for (const v of scanVerts) if (v.z > peakVert.z) peakVert = v;
    return {
      x: peakVert.x,
      y: peakVert.y,
      topSurfaceZ: peakVert.z,
      peakZ: peakVert.z,
      topVertCount: 1,
      localRx: 0,
      localRy: 0,
      score: Infinity,
      candidateIndex: 0,
    };
  }

  results.sort((a, b) => a.score - b.score);
  return { ...results[0], candidateIndex: 0 };
}

function icpRefineXY(
  crownVertsAtOrigin: THREE.Vector3[],
  grid: SpatialGrid,
  startPosition: THREE.Vector3,
  iterations = 25,
): THREE.Vector3 {
  const sample = downsample(crownVertsAtOrigin, 600);
  const pos = startPosition.clone();

  for (let iter = 0; iter < iterations; iter++) {
    let dx = 0,
      dy = 0,
      count = 0;
    for (const cv of sample) {
      const world = cv.clone().add(pos);
      const nearest = grid.nearest(world);
      if (!nearest) continue;
      dx += nearest.x - world.x;
      dy += nearest.y - world.y;
      count++;
    }
    if (count === 0) break;
    const sx = (dx / count) * 0.4;
    const sy = (dy / count) * 0.4;
    pos.x += sx;
    pos.y += sy;
    if (Math.sqrt(sx ** 2 + sy ** 2) < 0.003) break;
  }
  return pos;
}

// ── main ────────────────────────────────────────────────────────────────────

export async function runCrownPlacement(
  input: CrownPlacementInput,
): Promise<CrownPlacementResult> {
  const { scan, crown } = getPlacementMeshes();
  if (!scan || !crown) throw new Error("Meshes not loaded yet.");

  // Reset crown to origin every run — prevents position accumulation
  crown.position.set(0, 0, 0);
  crown.updateMatrixWorld(true);
  scan.updateMatrixWorld(true);

  const scanVerts = getWorldVertices(scan, 30000);
  const crownVertsAtOrigin = getCrownVertsAtOrigin(crown, 3000);
  const crownLocalZMin = getCrownLocalZMin(crown);

  const crownBox = new THREE.Box3().setFromPoints(crownVertsAtOrigin);
  const scanBox = new THREE.Box3().setFromPoints(scanVerts);
  const crownSizeX = crownBox.max.x - crownBox.min.x;
  const crownSizeY = crownBox.max.y - crownBox.min.y;
  const crownSizeZ = crownBox.max.z - crownBox.min.z;
  const crownRx = crownSizeX / 2;
  const crownRy = crownSizeY / 2;
  const scanHeightZ = scanBox.max.z - scanBox.min.z;

  // Find stump: best arch endpoint footprint match
  const stump = findStump(scanVerts, crownRx, crownRy, scanBox);

  // Compute absolute crown target position
  const SEATING_DEPTH = 0.3;
  const targetX = stump.x;
  const targetY = stump.y;
  const targetZ = stump.topSurfaceZ - crownLocalZMin - SEATING_DEPTH;

  const coarsePosition = new THREE.Vector3(targetX, targetY, targetZ);

  // ICP refinement — XY only, Z locked
  const topScanVerts = scanVerts.filter(
    (v) => v.z >= scanBox.max.z - scanHeightZ * 0.65,
  );
  const topGrid = new SpatialGrid(topScanVerts, 3.0);
  const refineVerts = topGrid.withinXYRadius(
    stump.x,
    stump.y,
    Math.max(crownRx, crownRy) * 2.5,
  );
  const refineGrid = new SpatialGrid(
    refineVerts.length > 20 ? refineVerts : topScanVerts,
    2.0,
  );

  const finalPosition = icpRefineXY(
    crownVertsAtOrigin,
    refineGrid,
    coarsePosition,
    25,
  );
  finalPosition.z = coarsePosition.z; // Z never changes — seating is geometric

  // Apply absolute position
  crown.position.set(finalPosition.x, finalPosition.y, finalPosition.z);
  crown.updateMatrixWorld(true);

  return {
    crownObjectId: input.crownObject.id,
    transformMatrix: new THREE.Matrix4()
      .makeTranslation(finalPosition.x, finalPosition.y, finalPosition.z)
      .toArray(),
    diagnostics: [
      `Scan verts: ${scanVerts.length}, Crown verts: ${crownVertsAtOrigin.length}`,
      `Crown: ${crownSizeX.toFixed(2)}x${crownSizeY.toFixed(2)}x${crownSizeZ.toFixed(2)}mm  rx=${crownRx.toFixed(2)} ry=${crownRy.toFixed(2)}mm`,
      `Crown LOCAL Z_min: ${crownLocalZMin.toFixed(4)}`,
      `Scan Z: ${scanBox.min.z.toFixed(2)}→${scanBox.max.z.toFixed(2)} (${scanHeightZ.toFixed(1)}mm)`,
      `Stump centroid: (${stump.x.toFixed(3)}, ${stump.y.toFixed(3)}, ${stump.topSurfaceZ.toFixed(3)})`,
      `Stump top footprint: ${(stump.localRx * 2).toFixed(2)} x ${(stump.localRy * 2).toFixed(2)} mm  (crown: ${crownSizeX.toFixed(2)} x ${crownSizeY.toFixed(2)} mm)`,
      `Stump match score: ${stump.score.toFixed(3)}  (lower=better, <0.5=good)`,
      `Stump peak Z: ${stump.peakZ.toFixed(3)}, top verts: ${stump.topVertCount}`,
      `Coarse position: (${coarsePosition.x.toFixed(2)}, ${coarsePosition.y.toFixed(2)}, ${coarsePosition.z.toFixed(2)})`,
      `Final position: (${finalPosition.x.toFixed(2)}, ${finalPosition.y.toFixed(2)}, ${finalPosition.z.toFixed(2)})`,
    ],
  };
}
