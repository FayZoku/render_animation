// Penggabung kotak ber-bevel menjadi satu geometry dengan vertex color (satu draw call per kelompok).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { BoxSpec } from "./townData";

const tmp = new THREE.Color();
const euler = new THREE.Euler();
const mat = new THREE.Matrix4();

export function mergeBoxes(boxes: BoxSpec[], defaultBevel = 0.1): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];
  for (const b of boxes) {
    const [w, h, d] = b.s;
    const r = Math.min(b.r ?? defaultBevel, Math.min(w, h, d) * 0.45);
    const g = new RoundedBoxGeometry(w, h, d, r > 0.12 ? 2 : 1, r);
    euler.set(b.rx ?? 0, b.ry ?? 0, b.rz ?? 0, "YXZ");
    mat.makeRotationFromEuler(euler);
    mat.setPosition(b.p[0], b.p[1], b.p[2]);
    g.applyMatrix4(mat);
    tmp.set(b.c);
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      col[i * 3] = tmp.r;
      col[i * 3 + 1] = tmp.g;
      col[i * 3 + 2] = tmp.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geos.push(g);
  }
  const merged = mergeGeometries(geos, false);
  geos.forEach((g) => g.dispose());
  if (!merged) throw new Error("mergeBoxes gagal (daftar kosong?)");
  return merged;
}
