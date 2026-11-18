import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { MATERIAL } from "../world/palette";

const boxes = new Map<string, THREE.BufferGeometry>();
export function getBox(w: number, h: number, d: number, r: number, seg = 2): THREE.BufferGeometry {
  const key = `${w}|${h}|${d}|${r}|${seg}`;
  const hit = boxes.get(key);
  if (hit) return hit;
  const g = new RoundedBoxGeometry(w, h, d, seg, Math.min(r, Math.min(w, h, d) * 0.48));
  boxes.set(key, g);
  return g;
}

const mats = new Map<string, THREE.MeshStandardMaterial>();
export function getMat(color: string): THREE.MeshStandardMaterial {
  const hit = mats.get(color);
  if (hit) return hit;
  const m = new THREE.MeshStandardMaterial({ color, roughness: MATERIAL.roughness, metalness: MATERIAL.metalness });
  mats.set(color, m);
  return m;
}
