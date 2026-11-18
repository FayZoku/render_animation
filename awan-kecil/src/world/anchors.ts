// Fungsi murni: posisi tokoh/objek penting per frame. Animasi, kamera, cahaya, dan audio memakai fungsi yang sama.
import { FPS, world } from "./data";
import { sceneRanges } from "./timeline";
import { DEG, applyEase, clamp, lerp, lerpAngle, smoothstep } from "./math";
import { hashString, makeRng } from "./prng";
import type { Act, CharacterDef, CloudKey, Expression, PathKey, Vec3 } from "./types";

// ---------------------------------------------------------------- konstanta tata letak
export const ROAD_HALF = 3;
export const SIDEWALK_OUTER = 9;
export const SIDEWALK_Y = 0.31;
/** tinggi tokoh (unit lokal sebelum scale): kaki 1.5 + torso 1.6 + kepala 1.4 */
export const CHAR_HEIGHT = 4.55;

export function groundY(_x: number, z: number): number {
  const az = Math.abs(z);
  const up = smoothstep(ROAD_HALF - 0.1, ROAD_HALF + 0.35, az);
  const down = smoothstep(SIDEWALK_OUTER - 0.2, SIDEWALK_OUTER + 0.2, az);
  return SIDEWALK_Y * (up - down);
}

// ---------------------------------------------------------------- indeks
const charById = new Map<string, CharacterDef>(world.characters.map((c) => [c.id, c]));
export const characterIds = world.characters.map((c) => c.id);
export function getCharacterDef(id: string): CharacterDef {
  const d = charById.get(id);
  if (!d) throw new Error(`[anchors] tokoh tidak dikenal: "${id}"`);
  return d;
}

// ---------------------------------------------------------------- path
interface PathCache {
  keys: PathKey[];
  cum: number[]; // jarak kumulatif di awal tiap keyframe
  len: number[];
}
const pathCache = new Map<string, PathCache>();
function getPathCache(def: CharacterDef): PathCache {
  const hit = pathCache.get(def.id);
  if (hit) return hit;
  const keys = [...def.path].sort((a, b) => a.t - b.t);
  const cum: number[] = [0];
  const len: number[] = [];
  for (let i = 0; i < keys.length - 1; i++) {
    const l = Math.hypot(keys[i + 1].pos[0] - keys[i].pos[0], keys[i + 1].pos[1] - keys[i].pos[1]);
    len.push(l);
    cum.push(cum[i] + l);
  }
  const c = { keys, cum, len };
  pathCache.set(def.id, c);
  return c;
}

function segmentAt(keys: PathKey[], t: number): number {
  if (keys.length < 2) return 0;
  for (let i = 0; i < keys.length - 1; i++) if (t < keys[i + 1].t) return i;
  return keys.length - 2;
}

interface PathSample {
  x: number;
  z: number;
  dist: number;
  seg: number;
}
function samplePath(def: CharacterDef, t: number): PathSample {
  const p = getPathCache(def);
  const { keys } = p;
  if (keys.length === 1 || t <= keys[0].t) return { x: keys[0].pos[0], z: keys[0].pos[1], dist: 0, seg: 0 };
  const last = keys[keys.length - 1];
  if (t >= last.t) return { x: last.pos[0], z: last.pos[1], dist: p.cum[keys.length - 1], seg: keys.length - 2 };
  const i = segmentAt(keys, t);
  const a = keys[i];
  const b = keys[i + 1];
  const u = applyEase(a.ease, (t - a.t) / Math.max(1e-6, b.t - a.t));
  return {
    x: lerp(a.pos[0], b.pos[0], u),
    z: lerp(a.pos[1], b.pos[1], u),
    dist: p.cum[i] + p.len[i] * u,
    seg: i,
  };
}

// ---------------------------------------------------------------- ekspresi (dari scenes[].expr)
interface ExprKey {
  t: number;
  expr: Expression;
}
const exprTimeline = new Map<string, ExprKey[]>();
for (const sc of world.scenes) {
  const r = sceneRanges.find((x) => x.id === sc.id);
  if (!r || !sc.expr) continue;
  for (const e of sc.expr) {
    const arr = exprTimeline.get(e.id) ?? [];
    arr.push({ t: r.start + (e.at ?? 0), expr: e.expr });
    exprTimeline.set(e.id, arr);
  }
}
for (const arr of exprTimeline.values()) arr.sort((a, b) => a.t - b.t);

function exprAt(def: CharacterDef, t: number): Expression {
  const arr = exprTimeline.get(def.id);
  let e: Expression = def.defaultExpr ?? "happy";
  if (arr) for (const k of arr) if (k.t <= t) e = k.expr;
  return e;
}

// ---------------------------------------------------------------- awan emosi
export interface CloudState {
  pos: Vec3;
  size: number;
  mood: number;
  rain: number;
  glow: number;
  merge: number;
  tint: string;
}

const DEFAULT_CLOUD: CloudKey[] = [{ t: 0, mood: 1, rain: 0, size: 0.9, glow: 0, merge: 0 }];

function sampleCloudKeys(keys: CloudKey[], t: number) {
  const ks = [...keys].sort((a, b) => a.t - b.t);
  const pick = (k: CloudKey) => ({
    mood: k.mood,
    rain: k.rain,
    size: k.size ?? 1,
    glow: k.glow ?? 0,
    merge: k.merge ?? 0,
  });
  if (t <= ks[0].t) return pick(ks[0]);
  if (t >= ks[ks.length - 1].t) return pick(ks[ks.length - 1]);
  for (let i = 0; i < ks.length - 1; i++) {
    if (t < ks[i + 1].t) {
      const u = smoothstep(0, 1, (t - ks[i].t) / (ks[i + 1].t - ks[i].t));
      const a = pick(ks[i]);
      const b = pick(ks[i + 1]);
      return {
        mood: lerp(a.mood, b.mood, u),
        rain: lerp(a.rain, b.rain, u),
        size: lerp(a.size, b.size, u),
        glow: lerp(a.glow, b.glow, u),
        merge: lerp(a.merge, b.merge, u),
      };
    }
  }
  return pick(ks[ks.length - 1]);
}

// ---------------------------------------------------------------- state tokoh
export interface CharState {
  id: string;
  t: number;
  visible: boolean;
  /** posisi kaki */
  pos: Vec3;
  yaw: number; // radian
  scale: number;
  speed: number; // unit/detik
  phase: number; // fase langkah (radian)
  amp: number; // 0..1 amplitudo langkah
  act: Act;
  expr: Expression;
  /** 0..1 seberapa kuat tokoh sedang menghindar */
  repel: number;
  cloud: CloudState;
}

interface RawState {
  visible: boolean;
  x: number;
  z: number;
  yaw: number;
  speed: number;
  phase: number;
  act: Act;
  seg: number;
}

function strideOf(def: CharacterDef) {
  return 3.3 * (def.scale ?? 0.8);
}

function rawState(def: CharacterDef, t: number): RawState {
  const s = samplePath(def, t);
  const dt = 1 / FPS;
  const s0 = samplePath(def, t - dt);
  const s1 = samplePath(def, t + dt);
  const vx = (s1.x - s0.x) / (2 * dt);
  const vz = (s1.z - s0.z) / (2 * dt);
  const speed = Math.hypot(vx, vz);
  const { keys } = getPathCache(def);

  // yaw dari keyframe (interpolasi sudut terpendek)
  const yawKeys = keys.filter((k) => k.yaw !== undefined);
  let kfYaw: number | null = null;
  if (yawKeys.length) {
    if (t <= yawKeys[0].t) kfYaw = (yawKeys[0].yaw as number) * DEG;
    else if (t >= yawKeys[yawKeys.length - 1].t) kfYaw = (yawKeys[yawKeys.length - 1].yaw as number) * DEG;
    else {
      for (let i = 0; i < yawKeys.length - 1; i++) {
        if (t < yawKeys[i + 1].t) {
          const u = (t - yawKeys[i].t) / (yawKeys[i + 1].t - yawKeys[i].t);
          kfYaw = lerpAngle((yawKeys[i].yaw as number) * DEG, (yawKeys[i + 1].yaw as number) * DEG, smoothstep(0, 1, u));
          break;
        }
      }
    }
  }
  // arah gerak terakhir (bila tidak ada yaw keyframe)
  let moveYaw = Math.atan2(vx, vz);
  if (speed < 0.05) {
    // pakai arah segmen terdekat yang panjangnya > 0
    const p = getPathCache(def);
    let i = s.seg;
    while (i > 0 && p.len[i] < 1e-3) i--;
    const a = keys[i];
    const b = keys[Math.min(i + 1, keys.length - 1)];
    moveYaw = Math.atan2(b.pos[0] - a.pos[0], b.pos[1] - a.pos[1]);
  }
  const w = smoothstep(0.25, 0.9, speed);
  const yaw = kfYaw === null ? moveYaw : lerpAngle(kfYaw, moveYaw, w);

  const act = keys[s.seg]?.act ?? "auto";
  const visible =
    (def.visibleFrom === undefined || t >= def.visibleFrom) &&
    (def.visibleUntil === undefined || t < def.visibleUntil);
  return {
    visible,
    x: s.x,
    z: s.z,
    yaw,
    speed,
    phase: (s.dist / strideOf(def)) * Math.PI * 2,
    act,
    seg: s.seg,
  };
}

function cloudOf(def: CharacterDef, raw: RawState, t: number): CloudState {
  const keys = def.cloud && def.cloud.length ? def.cloud : DEFAULT_CLOUD;
  const c = sampleCloudKeys(keys, t);
  const sc = def.scale ?? 0.8;
  const rng = makeRng(hashString(def.id) + 77);
  const jitter = def.cloud && def.cloud.length ? 1 : 0.9 + rng() * 0.25;
  const size = c.size * jitter;
  const baseY = groundY(raw.x, raw.z) + CHAR_HEIGHT * sc + 1.15 * size + 0.35;
  let pos: Vec3 = [raw.x, baseY, raw.z];
  if (def.partner && c.merge > 0.001) {
    const pdef = charById.get(def.partner);
    if (pdef) {
      const pr = rawState(pdef, t);
      const psc = pdef.scale ?? 0.8;
      const pBase = groundY(pr.x, pr.z) + CHAR_HEIGHT * psc + 1.15 * size + 0.35;
      const mid: Vec3 = [(raw.x + pr.x) / 2, Math.max(baseY, pBase) + 0.55, (raw.z + pr.z) / 2];
      const m = smoothstep(0, 1, c.merge);
      pos = [lerp(pos[0], mid[0], m), lerp(pos[1], mid[1], m), lerp(pos[2], mid[2], m)];
    }
  }
  return {
    pos,
    size,
    mood: c.mood,
    rain: c.rain,
    glow: c.glow,
    merge: c.merge,
    tint: def.cloudTint ?? "#ffd778",
  };
}

function repelFactor(def: CharacterDef, raw: RawState, t: number): number {
  const r = def.repel;
  if (!r) return 0;
  const src = charById.get(r.from);
  if (!src) return 0;
  const sr = rawState(src, t);
  if (!sr.visible) return 0;
  const rain = sampleCloudKeys(src.cloud && src.cloud.length ? src.cloud : DEFAULT_CLOUD, t).rain;
  const d = Math.hypot(raw.x - sr.x, raw.z - sr.z);
  const near = 1 - smoothstep(r.radius * 0.4, r.radius, d);
  const calm = 1 - smoothstep(r.until, r.until + 1.2, t);
  return clamp(near * rain * calm, 0, 1);
}

export function getCharacterState(id: string, frame: number): CharState {
  const def = getCharacterDef(id);
  const t = frame / FPS;
  const raw = rawState(def, t);
  const rep = repelFactor(def, raw, t);
  let z = raw.z;
  if (def.repel && rep > 0) {
    z = raw.z + def.repel.side * def.repel.push * rep;
    if (def.repel.zMin !== undefined) z = Math.max(z, def.repel.zMin);
    if (def.repel.zMax !== undefined) z = Math.min(z, def.repel.zMax);
  }
  const y = groundY(raw.x, z);
  let act = raw.act;
  let expr = exprAt(def, t);
  if (rep > 0.35) {
    act = "cover";
    expr = "shock";
  }
  const moving = raw.speed > 0.2;
  const amp = act === "idle" || !moving ? 0 : smoothstep(0.05, 1.5, raw.speed);
  const merged: RawState = { ...raw, z };
  return {
    id,
    t,
    visible: raw.visible,
    pos: [raw.x, y, z],
    yaw: raw.yaw,
    scale: def.scale ?? 0.8,
    speed: raw.speed,
    phase: raw.phase,
    amp,
    act,
    expr,
    repel: rep,
    cloud: cloudOf(def, merged, t),
  };
}

// ---------------------------------------------------------------- anchor
export const SPECIAL_ANCHORS = ["town", "origin", "crowd", "rainbow"] as const;

export function isKnownAnchor(name: string): boolean {
  return name.split("+").every((part) => {
    const [base, sub] = part.trim().split(".");
    if (sub !== undefined && !["head", "cloud", "feet"].includes(sub)) return false;
    return (
      (SPECIAL_ANCHORS as readonly string[]).includes(base) ||
      charById.has(base) ||
      world.objects.some((o) => o.id === base)
    );
  });
}

export function getRainbowCenter(frame: number): Vec3 {
  const c = getAnchor(world.rainbow.center, frame);
  return [c[0], groundY(c[0], c[2]) + world.rainbow.height, c[2]];
}

function single(part: string, frame: number): Vec3 {
  const [base, sub] = part.split(".");
  if (base === "town") return [0, 3, 5];
  if (base === "origin") return [0, 0, 0];
  if (base === "rainbow") return getRainbowCenter(frame);
  if (base === "crowd") {
    let n = 0;
    const acc: Vec3 = [0, 0, 0];
    for (const d of world.characters) {
      if (d.role !== "extra") continue;
      const s = getCharacterState(d.id, frame);
      if (!s.visible) continue;
      acc[0] += s.pos[0];
      acc[1] += s.pos[1] + 2.4 * s.scale;
      acc[2] += s.pos[2];
      n++;
    }
    return n ? [acc[0] / n, acc[1] / n, acc[2] / n] : [0, 3, 5];
  }
  if (charById.has(base)) {
    const s = getCharacterState(base, frame);
    if (sub === "cloud") return s.cloud.pos;
    if (sub === "feet") return [s.pos[0], s.pos[1], s.pos[2]];
    if (sub === "head") return [s.pos[0], s.pos[1] + 4.0 * s.scale, s.pos[2]];
    return [s.pos[0], s.pos[1] + 2.9 * s.scale, s.pos[2]]; // dada
  }
  const o = world.objects.find((x) => x.id === base);
  if (o) return [o.pos[0], (o.size ? o.size[1] : 2) / 2, o.pos[1]];
  throw new Error(`[anchors] anchor tidak dikenal: "${part}"`);
}

/** Posisi anchor pada frame tertentu. Mendukung "a+b" (titik tengah), "tokoh.head", "tokoh.cloud", "tokoh.feet". */
export function getAnchor(id: string, frame: number): Vec3 {
  const parts = id.split("+").map((p) => p.trim());
  if (parts.length === 1) return single(parts[0], frame);
  const acc: Vec3 = [0, 0, 0];
  for (const p of parts) {
    const v = single(p, frame);
    acc[0] += v[0];
    acc[1] += v[1];
    acc[2] += v[2];
  }
  return [acc[0] / parts.length, acc[1] / parts.length, acc[2] / parts.length];
}

/** Anchor dengan peredaman deterministik: rata-rata target dari frame tertinggal (lag-2 .. lag+2). */
export function getSmoothedAnchor(id: string, frame: number, lag: number): Vec3 {
  const acc: Vec3 = [0, 0, 0];
  let n = 0;
  for (let k = -2; k <= 2; k++) {
    const v = getAnchor(id, Math.max(0, frame - lag + k));
    acc[0] += v[0];
    acc[1] += v[1];
    acc[2] += v[2];
    n++;
  }
  return [acc[0] / n, acc[1] / n, acc[2] / n];
}

// ---------------------------------------------------------------- pelangi & level hujan
export interface RainbowState {
  visible: boolean;
  center: Vec3;
  /** detik sejak muncul */
  age: number;
}
export function getRainbow(frame: number): RainbowState {
  const t = frame / FPS;
  return { visible: t >= world.rainbow.appearAt, center: getRainbowCenter(frame), age: t - world.rainbow.appearAt };
}

/** 0..1, dipakai untuk volume suara hujan. */
export function getRainLevel(frame: number): number {
  let m = 0;
  for (const d of world.characters) {
    if (!d.cloud || !d.cloud.some((k) => k.rain > 0)) continue;
    const s = getCharacterState(d.id, frame);
    if (s.visible) m = Math.max(m, s.cloud.rain);
  }
  return m;
}
