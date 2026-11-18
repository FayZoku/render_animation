// Lingkungan (cahaya, langit, kabut) per frame: fungsi murni dari world.json scenes[].env.
import { FPS, world } from "./data";
import { sceneIndexAt, sceneRanges } from "./timeline";
import { ENV_PRESETS, GLOOM, RADIANT, type EnvPreset } from "./palette";
import { clamp, lerp, lerpHex, smoothstep } from "./math";
import type { Vec3 } from "./types";

export interface Env extends Omit<EnvPreset, "sunDir"> {
  sunDir: Vec3;
}

function norm(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

function sceneEnv(index: number, progress: number): Env {
  const sc = world.scenes[index] ?? world.scenes[world.scenes.length - 1];
  const base = ENV_PRESETS[sc.env.preset] ?? ENV_PRESETS.morning;
  const dim = Array.isArray(sc.env.dim) ? lerp(sc.env.dim[0], sc.env.dim[1], clamp(progress, 0, 1)) : sc.env.dim;
  const e: Env = { ...base, sunDir: norm(base.sunDir) };
  if (dim > 0) {
    const g = clamp(dim, 0, 1);
    e.sunIntensity = base.sunIntensity * (1 - 0.5 * g);
    e.ambIntensity = base.ambIntensity * (1 - 0.08 * g);
    e.sunColor = lerpHex(base.sunColor, GLOOM.sun, 0.7 * g);
    e.ambColor = lerpHex(base.ambColor, GLOOM.amb, 0.6 * g);
    e.skyTop = lerpHex(base.skyTop, GLOOM.sky, 0.7 * g);
    e.skyMid = lerpHex(base.skyMid, GLOOM.sky, 0.6 * g);
    e.skyHor = lerpHex(base.skyHor, GLOOM.fog, 0.55 * g);
    e.fog = lerpHex(base.fog, GLOOM.fog, 0.65 * g);
  } else if (dim < 0) {
    const g = clamp(-dim, 0, 1);
    e.sunIntensity = base.sunIntensity * (1 + 0.25 * g);
    e.sunColor = lerpHex(base.sunColor, RADIANT.sun, 0.6 * g);
    e.ambColor = lerpHex(base.ambColor, RADIANT.amb, 0.5 * g);
    e.skyMid = lerpHex(base.skyMid, RADIANT.sky, 0.55 * g);
    e.skyHor = lerpHex(base.skyHor, RADIANT.sky, 0.5 * g);
    e.fog = lerpHex(base.fog, RADIANT.fog, 0.5 * g);
  }
  return e;
}

function mixEnv(a: Env, b: Env, t: number): Env {
  return {
    sunColor: lerpHex(a.sunColor, b.sunColor, t),
    sunIntensity: lerp(a.sunIntensity, b.sunIntensity, t),
    ambColor: lerpHex(a.ambColor, b.ambColor, t),
    ambIntensity: lerp(a.ambIntensity, b.ambIntensity, t),
    skyTop: lerpHex(a.skyTop, b.skyTop, t),
    skyMid: lerpHex(a.skyMid, b.skyMid, t),
    skyHor: lerpHex(a.skyHor, b.skyHor, t),
    fog: lerpHex(a.fog, b.fog, t),
    fogNear: lerp(a.fogNear, b.fogNear, t),
    fogFar: lerp(a.fogFar, b.fogFar, t),
    sunDir: norm([lerp(a.sunDir[0], b.sunDir[0], t), lerp(a.sunDir[1], b.sunDir[1], t), lerp(a.sunDir[2], b.sunDir[2], t)]),
  };
}

export function getEnv(frame: number): Env {
  const i = sceneIndexAt(frame);
  const r = sceneRanges[i];
  const prog = (frame - r.startFrame) / Math.max(1, r.endFrame - r.startFrame);
  const cur = sceneEnv(i, prog);
  const blendFrames = 0.8 * FPS;
  const local = frame - r.startFrame;
  if (i > 0 && local < blendFrames) {
    const prev = sceneEnv(i - 1, 1);
    return mixEnv(prev, cur, smoothstep(0, 1, local / blendFrames));
  }
  return cur;
}
