// Pembangun kota (data murni, tanpa three): daftar kotak berwarna + kotak padat (untuk clearance kamera).
import { world } from "./data";
import { AWNING_ACCENTS, BUILDING_BODIES, PALETTE } from "./palette";
import { DEG, shadeHex } from "./math";
import { hashString, makeRng, rngPick, rngRange, type Rng } from "./prng";
import type { ObjectDef, Vec3 } from "./types";

export interface BoxSpec {
  p: Vec3;
  s: Vec3;
  c: string;
  /** radius bevel */
  r?: number;
  rx?: number;
  ry?: number;
  rz?: number;
}
export interface AABB {
  min: Vec3;
  max: Vec3;
}
export interface TownData {
  buildings: BoxSpec[];
  trees: BoxSpec[];
  props: BoxSpec[];
  ring: BoxSpec[];
  hills: BoxSpec[];
  solids: AABB[];
}

const OLIVES = ["#a3b57c", "#97ad72", "#b3c28b", "#8aa267", "#a9ba82"];

function place(local: BoxSpec[], x: number, z: number, yawDeg: number, y = 0): BoxSpec[] {
  const th = yawDeg * DEG;
  const c = Math.cos(th);
  const s = Math.sin(th);
  return local.map((b) => ({
    ...b,
    p: [b.p[0] * c + b.p[2] * s + x, b.p[1] + y, -b.p[0] * s + b.p[2] * c + z] as Vec3,
    ry: (b.ry ?? 0) + th,
  }));
}

// ------------------------------------------------------------------ bangunan (fasad di z=0, badan ke -z)
function buildingLocal(w: number, h: number, d: number, body: string, accent: string, rng: Rng, detailed: boolean): BoxSpec[] {
  const cream = PALETTE.cream;
  const out: BoxSpec[] = [];
  out.push({ p: [0, h / 2, -d / 2], s: [w, h, d], c: body, r: 0.2 });
  out.push({ p: [0, h + 0.22, -d / 2 + 0.1], s: [w + 0.6, 0.46, d + 0.5], c: cream, r: 0.12 });
  out.push({ p: [0, h + 0.75, -d / 2], s: [w * 0.82, 0.62, d * 0.8], c: shadeHex(body, -0.08), r: 0.15 });
  if (!detailed) {
    // bangunan jauh: jendela besar sederhana
    for (const sx of [-1, 1]) {
      out.push({ p: [sx * w * 0.24, h * 0.55, 0.05], s: [w * 0.22, h * 0.22, 0.12], c: PALETTE.glass, r: 0.05 });
    }
    out.push({ p: [0, 2.7, 0.2], s: [w * 0.7, 0.2, 1.4], c: accent, r: 0.05, rx: 0.3 });
    return out;
  }
  if (rng() > 0.45) {
    out.push({ p: [w * 0.28, h + 1.5, -d * 0.35], s: [0.95, 1.5, 0.95], c: shadeHex(body, -0.14), r: 0.1 });
    out.push({ p: [w * 0.28, h + 2.35, -d * 0.35], s: [1.2, 0.26, 1.2], c: cream, r: 0.06 });
  }
  // lantai dasar: pintu + etalase
  const doorX = -w * 0.26;
  out.push({ p: [doorX, 1.4, 0.08], s: [1.9, 2.8, 0.16], c: cream, r: 0.05 });
  out.push({ p: [doorX, 1.32, 0.17], s: [1.5, 2.5, 0.1], c: PALETTE.lavender, r: 0.04 });
  out.push({ p: [w * 0.2, 1.55, 0.08], s: [3.0, 2.3, 0.16], c: cream, r: 0.05 });
  out.push({ p: [w * 0.2, 1.55, 0.16], s: [2.6, 1.9, 0.1], c: PALETTE.glass, r: 0.04 });
  out.push({ p: [w * 0.2, 1.55, 0.23], s: [0.08, 1.9, 0.08], c: cream, r: 0.02 });
  // kanopi bergaris
  const aw = Math.min(w * 0.92, 6.4);
  const n = 6;
  for (let i = 0; i < n; i++) {
    out.push({
      p: [-aw / 2 + (i + 0.5) * (aw / n), 3.15, 0.95],
      s: [aw / n, 0.13, 1.8],
      c: i % 2 === 0 ? accent : "#fff8f0",
      r: 0.04,
      rx: 0.32,
    });
  }
  out.push({ p: [0, 2.76, 1.78], s: [aw, 0.28, 0.1], c: accent, r: 0.03 });
  // jendela atas berbingkai
  const rows = Math.max(1, Math.floor((h - 3.6) / 2.6));
  for (let k = 0; k < rows; k++) {
    const y = 4.4 + k * 2.6;
    for (const sx of [-1, 1]) {
      const x = sx * w * 0.25;
      out.push({ p: [x, y, 0.07], s: [1.35, 1.95, 0.14], c: cream, r: 0.05 });
      out.push({ p: [x, y, 0.14], s: [1.0, 1.55, 0.1], c: PALETTE.glass, r: 0.03 });
      out.push({ p: [x, y, 0.21], s: [0.08, 1.55, 0.08], c: cream, r: 0.02 });
      out.push({ p: [x, y, 0.21], s: [1.0, 0.08, 0.08], c: cream, r: 0.02 });
    }
  }
  return out;
}

function treeLocal(scale: number, rng: Rng): BoxSpec[] {
  const out: BoxSpec[] = [];
  const brown = PALETTE.brown;
  out.push({ p: [0, 2.2, 0], s: [0.8, 4.4, 0.8], c: brown, r: 0.1 });
  out.push({ p: [0.65, 4.0, 0], s: [1.5, 0.5, 0.55], c: brown, r: 0.08 });
  out.push({ p: [1.25, 4.5, 0], s: [0.55, 1.0, 0.55], c: brown, r: 0.08 });
  out.push({ p: [-0.55, 3.6, 0.1], s: [1.2, 0.5, 0.55], c: shadeHex(brown, -0.08), r: 0.08 });
  const base = rngPick(rng, OLIVES);
  out.push({ p: [0, 5.3, 0], s: [3.0, 1.5, 3.0], c: base, r: 0.25 });
  out.push({ p: [0.15, 6.5, -0.1], s: [2.5, 1.4, 2.5], c: rngPick(rng, OLIVES), r: 0.25 });
  out.push({ p: [-0.1, 7.6, 0.1], s: [1.7, 1.2, 1.7], c: rngPick(rng, OLIVES), r: 0.22 });
  for (let i = 0; i < 4; i++) {
    const a = rng() * Math.PI * 2;
    out.push({
      p: [Math.cos(a) * 1.5, 5.2 + rng() * 1.8, Math.sin(a) * 1.5],
      s: [1.1 + rng() * 0.6, 1.0 + rng() * 0.5, 1.1 + rng() * 0.6],
      c: rngPick(rng, OLIVES),
      r: 0.2,
    });
  }
  return out.map((b) => ({ ...b, p: [b.p[0] * scale, b.p[1] * scale, b.p[2] * scale] as Vec3, s: [b.s[0] * scale, b.s[1] * scale, b.s[2] * scale] as Vec3 }));
}

function lampLocal(): BoxSpec[] {
  return [
    { p: [0, 0.25, 0], s: [0.8, 0.5, 0.8], c: "#b9aec8", r: 0.1 },
    { p: [0, 2.6, 0], s: [0.22, 4.6, 0.22], c: "#8f869e", r: 0.06 },
    { p: [0.35, 4.85, 0], s: [0.9, 0.18, 0.18], c: "#8f869e", r: 0.05 },
    { p: [0.8, 4.6, 0], s: [0.62, 0.62, 0.62], c: "#fff0cf", r: 0.12 },
  ];
}

function bushLocal(rng: Rng): BoxSpec[] {
  const out: BoxSpec[] = [];
  for (let i = 0; i < 4; i++) {
    out.push({
      p: [(rng() - 0.5) * 1.5, 0.45 + rng() * 0.3, (rng() - 0.5) * 0.9],
      s: [1.0 + rng() * 0.5, 0.9 + rng() * 0.4, 1.0 + rng() * 0.4],
      c: rngPick(rng, OLIVES),
      r: 0.2,
    });
  }
  return out;
}

function signLocal(): BoxSpec[] {
  const wood = PALETTE.brownLight;
  return [
    { p: [-0.55, 1.1, 0.25], s: [0.14, 2.3, 0.14], c: wood, r: 0.03, rx: 0.2 },
    { p: [0.55, 1.1, 0.25], s: [0.14, 2.3, 0.14], c: wood, r: 0.03, rx: 0.2 },
    { p: [0, 1.35, 0.22], s: [1.3, 1.4, 0.12], c: "#fff6ec", r: 0.05, rx: 0.2 },
    { p: [0, 1.6, 0.3], s: [0.8, 0.12, 0.05], c: PALETTE.brownLight, r: 0.02, rx: 0.2 },
    { p: [0, 1.25, 0.3], s: [0.8, 0.12, 0.05], c: PALETTE.pinkDeep, r: 0.02, rx: 0.2 },
  ];
}

function bollardLocal(color: string): BoxSpec[] {
  return [
    { p: [0, 0.5, 0], s: [0.55, 1.0, 0.55], c: color, r: 0.14 },
    { p: [0, 1.05, 0], s: [0.62, 0.14, 0.62], c: PALETTE.cream, r: 0.05 },
  ];
}

function planterLocal(rng: Rng): BoxSpec[] {
  const out: BoxSpec[] = [{ p: [0, 0.4, 0], s: [1.7, 0.8, 0.9], c: PALETTE.cream, r: 0.12 }];
  out.push({ p: [0, 1.0, 0], s: [1.5, 0.5, 0.7], c: rngPick(rng, OLIVES), r: 0.15 });
  for (let i = 0; i < 4; i++) {
    out.push({ p: [-0.55 + i * 0.36, 1.4, (rng() - 0.5) * 0.2], s: [0.24, 0.24, 0.24], c: rngPick(rng, [PALETTE.pink, PALETTE.butter, PALETTE.lavender]), r: 0.05 });
  }
  return out;
}

// ------------------------------------------------------------------ pembangun utama
let cache: TownData | null = null;

export function buildTown(): TownData {
  if (cache) return cache;
  const t: TownData = { buildings: [], trees: [], props: [], ring: [], hills: [], solids: [] };

  for (const o of world.objects) {
    const rng = makeRng(o.seed ?? hashString(o.id));
    const [x, z] = o.pos;
    const rot = o.rot ?? 0;
    switch (o.type) {
      case "building": {
        const [w, h, d] = o.size ?? [7.5, 9, 7];
        const body = o.color ?? rngPick(rng, BUILDING_BODIES);
        const acc = o.accent ?? rngPick(rng, AWNING_ACCENTS);
        t.buildings.push(...place(buildingLocal(w, h, d, body, acc, rng, true), x, z, rot));
        const swap = Math.abs(Math.round(rot / 90)) % 2 === 1;
        const hw = (swap ? d : w) / 2;
        const hd = (swap ? w : d) / 2;
        // pusat badan: fasad di (x,z), badan ke arah -z lokal yang diputar
        const th = rot * DEG;
        const cx = x + Math.sin(th) * (-d / 2);
        const cz = z + Math.cos(th) * (-d / 2);
        t.solids.push({ min: [cx - hw, 0, cz - hd], max: [cx + hw, h + 1.4, cz + hd] });
        break;
      }
      case "tree": {
        const sc = o.size ? o.size[1] : 1;
        t.trees.push(...place(treeLocal(sc, rng), x, z, rot));
        t.solids.push({ min: [x - 0.5 * sc, 0, z - 0.5 * sc], max: [x + 0.5 * sc, 4.2 * sc, z + 0.5 * sc] });
        break;
      }
      case "lamp":
        t.props.push(...place(lampLocal(), x, z, rot, 0.28));
        break;
      case "bush":
        t.props.push(...place(bushLocal(rng), x, z, rot, 0.28));
        break;
      case "sign":
        t.props.push(...place(signLocal(), x, z, rot, 0.28));
        break;
      case "bollard":
        t.props.push(...place(bollardLocal(o.color ?? PALETTE.pinkDeep), x, z, rot, 0.28));
        break;
      case "planter":
        t.props.push(...place(planterLocal(rng), x, z, rot, 0.28));
        break;
    }
  }

  buildRing(t);
  cache = t;
  return t;
}

function insideStage(x: number, z: number): boolean {
  // wilayah yang sudah diisi objek eksplisit (jalan utama + gang)
  if (Math.abs(x) < 78 && Math.abs(z) < 17) return true;
  const alley = world.objects.find((o) => o.id === "alley-end");
  if (alley && Math.abs(x - alley.pos[0]) < 6.5 && z > 0 && z < alley.pos[1] + 3) return true;
  return false;
}

function buildRing(t: TownData) {
  const R = world.ring;
  const rng = makeRng(R.seed);

  // 1) jalan utama berlanjut sampai cakrawala (kedua arah, kedua sisi)
  for (const dir of [-1, 1]) {
    for (const side of [-1, 1]) {
      let cursor = R.street.from;
      while (cursor < R.street.to) {
        const w = rngRange(rng, 6.8, 9.2);
        const h = rngRange(rng, 7, 11);
        const x = dir * (cursor + w / 2);
        const body = rngPick(rng, BUILDING_BODIES);
        const acc = rngPick(rng, AWNING_ACCENTS);
        t.ring.push(...place(buildingLocal(w, h, 7, body, acc, rng, false), x, side * 9, side > 0 ? 180 : 0));
        if (rng() > 0.55) {
          t.ring.push(...place(treeLocal(rngRange(rng, 0.9, 1.15), rng), dir * (cursor + rngRange(rng, 0, w)), side * 3.35, 0));
        }
        cursor += w + 0.3;
      }
    }
  }

  // 2) baris belakang (mengisi area di balik jalan utama)
  const F = R.fill;
  for (let i = 0; i < F.count; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const x = rngRange(rng, -F.xRange, F.xRange);
    const z = side * rngRange(rng, F.zMin, F.zMax);
    if (Math.abs(x - 16.75) < 5 && side > 0 && z < 44) continue;
    const w = rngRange(rng, 8, 14);
    const h = rngRange(rng, 6, 12);
    const d = rngRange(rng, 7, 12);
    const body = rngPick(rng, BUILDING_BODIES);
    t.ring.push(...place(buildingLocal(w, h, d, body, rngPick(rng, AWNING_ACCENTS), rng, false), x, z, side > 0 ? 180 : 0));
    if (rng() > 0.4) t.ring.push(...place(treeLocal(rngRange(rng, 1, 1.4), rng), x + rngRange(rng, -6, 6), z - side * (d / 2 + 4), 0));
  }

  // 3) cincin bangunan jauh ke segala arah
  const B = R.buildings;
  for (let i = 0; i < B.count; i++) {
    const a = (i / B.count) * Math.PI * 2 + rng() * 0.2;
    const r = rngRange(rng, B.rMin, B.rMax);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (insideStage(x, z)) continue;
    const w = rngRange(rng, 9, 18);
    const h = rngRange(rng, 8, 22);
    const yaw = (Math.atan2(-x, -z) * 180) / Math.PI;
    t.ring.push(...place(buildingLocal(w, h, rngRange(rng, 8, 14), rngPick(rng, BUILDING_BODIES), rngPick(rng, AWNING_ACCENTS), rng, false), x, z, yaw));
  }

  // 4) pohon jauh
  const T = R.trees;
  for (let i = 0; i < T.count; i++) {
    const a = rng() * Math.PI * 2;
    const r = rngRange(rng, T.rMin, T.rMax);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (insideStage(x, z)) continue;
    t.ring.push(...place(treeLocal(rngRange(rng, 1.2, 2.2), rng), x, z, rng() * 360));
  }

  // 5) bukit blok di cakrawala (semua arah)
  const H = R.hills;
  const hillColors = ["#b9c79a", "#c9c6df", "#d8c3cf", "#aebf93", "#cdd5b4"];
  for (let i = 0; i < H.count; i++) {
    const a = (i / H.count) * Math.PI * 2 + rng() * 0.25;
    const r = rngRange(rng, H.rMin, H.rMax);
    const w = rngRange(rng, 60, 120);
    const h = rngRange(rng, 14, 34);
    const d = rngRange(rng, 40, 80);
    const yaw = (Math.atan2(-Math.cos(a), -Math.sin(a)) * 180) / Math.PI;
    t.hills.push(...place([{ p: [0, h / 2 - 2, 0], s: [w, h, d], c: rngPick(rng, hillColors), r: 5 }], Math.cos(a) * r, Math.sin(a) * r, yaw));
    t.hills.push(...place([{ p: [rngRange(rng, -w / 4, w / 4), h / 2 + 2, 0], s: [w * 0.5, h * 0.7, d * 0.6], c: rngPick(rng, hillColors), r: 4 }], Math.cos(a) * r, Math.sin(a) * r, yaw));
  }
}

export function getSolids(): AABB[] {
  return buildTown().solids;
}
export type { ObjectDef };
