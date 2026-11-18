// Kamera sinematografi (fungsi murni). Dipakai CameraRig, Lighting, Rainbow, dan skrip pemeriksa.
import { FPS, cameraData } from "./data";
import { characterIds, getAnchor, getCharacterState, getSmoothedAnchor, groundY } from "./anchors";
import { DEG, applyEase, catmull, clamp, lerp, lerpAngle, smoothstep } from "./math";
import { sceneIndexAt, sceneRanges } from "./timeline";
import { getSolids } from "./townData";
import { validateAll } from "./validate";
import type { ShotDef, Vec3 } from "./types";

validateAll();

export interface CameraPose {
  pos: Vec3;
  lookAt: Vec3;
  fov: number;
  /** radian */
  roll: number;
}

/** Batas clearance (dicatat di README). */
export const CLEARANCE = {
  minAboveGround: 0.95,
  solidMargin: 0.9,
  characterRadius: 1.25,
  cloudRadius: 1.9,
};

function splineAt(keys: ShotDef["keyframes"], t: number, pick: (k: ShotDef["keyframes"][number]) => number): number {
  const n = keys.length;
  if (t <= keys[0].t) return pick(keys[0]);
  if (t >= keys[n - 1].t) return pick(keys[n - 1]);
  let i = 0;
  while (i < n - 2 && t >= keys[i + 1].t) i++;
  const u = (t - keys[i].t) / Math.max(1e-6, keys[i + 1].t - keys[i].t);
  const p0 = pick(keys[Math.max(0, i - 1)]);
  const p1 = pick(keys[i]);
  const p2 = pick(keys[i + 1]);
  const p3 = pick(keys[Math.min(n - 1, i + 2)]);
  return catmull(p0, p1, p2, p3, u);
}

function shotPose(shot: ShotDef, frame: number, startFrame: number, endFrame: number): CameraPose {
  const keys = [...shot.keyframes].sort((a, b) => a.t - b.t);
  const raw = (frame - startFrame) / Math.max(1, endFrame - startFrame);
  const t = applyEase(shot.ease, clamp(raw, 0, 1));
  const pos: Vec3 = [
    splineAt(keys, t, (k) => k.pos[0]),
    splineAt(keys, t, (k) => k.pos[1]),
    splineAt(keys, t, (k) => k.pos[2]),
  ];
  const look: Vec3 = [
    splineAt(keys, t, (k) => k.lookAt[0]),
    splineAt(keys, t, (k) => k.lookAt[1]),
    splineAt(keys, t, (k) => k.lookAt[2]),
  ];
  const fov = splineAt(keys, t, (k) => k.fov);

  if (shot.anchor) {
    const lag = clamp(shot.lag ?? 6, 4, 8);
    const a = getSmoothedAnchor(shot.anchor, frame, lag);
    const lookAheadSec = shot.lookAhead ?? (shot.type === "follow" ? 0.35 : 0);
    if (lookAheadSec > 0) {
      const a0 = getAnchor(shot.anchor, Math.max(0, frame - 6));
      const a1 = getAnchor(shot.anchor, frame);
      const k = (lookAheadSec * FPS) / 6;
      a[0] += (a1[0] - a0[0]) * k;
      a[2] += (a1[2] - a0[2]) * k;
    }
    pos[0] += a[0];
    pos[1] += a[1];
    pos[2] += a[2];
    look[0] += a[0];
    look[1] += a[1];
    look[2] += a[2];
  }

  const sway = shot.sway ?? 0;
  if (sway > 0) {
    pos[0] += Math.sin(frame * 0.021 + 1.3) * 0.16 * sway;
    pos[1] += Math.sin(frame * 0.017) * 0.1 * sway;
    pos[2] += Math.cos(frame * 0.019 + 0.4) * 0.16 * sway;
    look[0] += Math.sin(frame * 0.013) * 0.06 * sway;
    look[1] += Math.cos(frame * 0.016) * 0.05 * sway;
  }
  return { pos, lookAt: look, fov, roll: (shot.roll ?? 0) * DEG };
}

function dirOf(p: CameraPose): { yaw: number; pitch: number } {
  const dx = p.lookAt[0] - p.pos[0];
  const dy = p.lookAt[1] - p.pos[1];
  const dz = p.lookAt[2] - p.pos[2];
  return { yaw: Math.atan2(dx, dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) };
}

function blendPose(a: CameraPose, b: CameraPose, t: number): CameraPose {
  const da = dirOf(a);
  const db = dirOf(b);
  const yaw = lerpAngle(da.yaw, db.yaw, t);
  const pitch = lerp(da.pitch, db.pitch, t);
  const pos: Vec3 = [lerp(a.pos[0], b.pos[0], t), lerp(a.pos[1], b.pos[1], t), lerp(a.pos[2], b.pos[2], t)];
  const cp = Math.cos(pitch);
  const look: Vec3 = [pos[0] + Math.sin(yaw) * cp * 10, pos[1] + Math.sin(pitch) * 10, pos[2] + Math.cos(yaw) * cp * 10];
  return { pos, lookAt: look, fov: lerp(a.fov, b.fov, t), roll: lerp(a.roll, b.roll, t) };
}

/** Dorong kamera keluar dari balok/tokoh/awan dan jaga di atas tanah. */
export function applyClearance(pos: Vec3, frame: number): Vec3 {
  const p: Vec3 = [pos[0], pos[1], pos[2]];
  for (let pass = 0; pass < 2; pass++) {
    for (const b of getSolids()) {
      const m = CLEARANCE.solidMargin;
      if (p[1] > b.max[1] + m) continue;
      if (p[0] > b.min[0] - m && p[0] < b.max[0] + m && p[2] > b.min[2] - m && p[2] < b.max[2] + m) {
        const dl = p[0] - (b.min[0] - m);
        const dr = b.max[0] + m - p[0];
        const df = p[2] - (b.min[2] - m);
        const db = b.max[2] + m - p[2];
        const mn = Math.min(dl, dr, df, db);
        if (mn === dl) p[0] = b.min[0] - m;
        else if (mn === dr) p[0] = b.max[0] + m;
        else if (mn === df) p[2] = b.min[2] - m;
        else p[2] = b.max[2] + m;
      }
    }
  }
  for (const id of characterIds) {
    const s = getCharacterState(id, frame);
    if (!s.visible) continue;
    const r = CLEARANCE.characterRadius * s.scale + 0.5;
    const top = s.pos[1] + 4.6 * s.scale + 0.6;
    if (p[1] > s.pos[1] - 0.6 && p[1] < top) {
      const dx = p[0] - s.pos[0];
      const dz = p[2] - s.pos[2];
      const d = Math.hypot(dx, dz);
      if (d < r) {
        const k = d < 1e-4 ? 1 : r / d;
        p[0] = s.pos[0] + (d < 1e-4 ? r : dx * k);
        p[2] = s.pos[2] + (d < 1e-4 ? 0 : dz * k);
      }
    }
    const c = s.cloud;
    const cr = CLEARANCE.cloudRadius * c.size;
    const cx = p[0] - c.pos[0];
    const cy = p[1] - c.pos[1];
    const cz = p[2] - c.pos[2];
    const cd = Math.hypot(cx, cy, cz);
    if (cd < cr && cd > 1e-4) {
      const k = cr / cd;
      p[0] = c.pos[0] + cx * k;
      p[1] = c.pos[1] + cy * k;
      p[2] = c.pos[2] + cz * k;
    }
  }
  const gy = groundY(p[0], p[2]);
  p[1] = Math.max(p[1], gy + CLEARANCE.minAboveGround);
  return p;
}

export function getCameraPose(frame: number): CameraPose {
  const i = sceneIndexAt(frame);
  const r = sceneRanges[i];
  const shot = cameraData.shots[i];
  const cur = shotPose(shot, frame, r.startFrame, r.endFrame);
  let pose = cur;
  const transFrames = Math.round((shot.transition ?? 0.6) * FPS);
  const local = frame - r.startFrame;
  if (i > 0 && transFrames > 0 && local < transFrames) {
    const pr = sceneRanges[i - 1];
    const prev = shotPose(cameraData.shots[i - 1], frame, pr.startFrame, pr.endFrame);
    const w = smoothstep(0, 1, local / transFrames);
    pose = blendPose(prev, cur, w);
  }
  return { pos: applyClearance(pose.pos, frame), lookAt: pose.lookAt, fov: pose.fov, roll: pose.roll };
}

