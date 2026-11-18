// npm run check -> pemeriksaan matematis (tanpa render): proyeksi subjek ke frame 9:16 untuk tiap adegan.
import { getAnchor, getCharacterState, getRainbowCenter } from "../src/world/anchors";
import { getCameraPose } from "../src/world/camera";
import { FPS } from "../src/world/data";
import { sceneRanges } from "../src/world/timeline";
import { world } from "../src/world/data";
import type { Vec3 } from "../src/world/types";

const ASPECT = 1080 / 1920;
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: Vec3): Vec3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

function project(p: Vec3, pos: Vec3, look: Vec3, fov: number) {
  const f = norm(sub(look, pos));
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  const d = sub(p, pos);
  const z = dot(d, f);
  const t = Math.tan((fov * Math.PI) / 360);
  return { x: dot(d, r) / z / (t * ASPECT), y: dot(d, u) / z / t, z };
}

const f2 = (v: number) => v.toFixed(2).padStart(6);
let bad = 0;
for (const r of sceneRanges) {
  const sc = world.scenes[r.index];
  console.log(`\nAdegan ${r.id} [${r.start.toFixed(1)}-${r.end.toFixed(1)}s] anchor=${sc.anchor}`);
  for (const k of [0.02, 0.35, 0.7, 0.98]) {
    const frame = Math.min(r.endFrame - 1, Math.round(r.startFrame + (r.endFrame - r.startFrame) * k));
    const pose = getCameraPose(frame);
    const ids = sc.anchor.split("+").map((s) => s.trim()).filter((s) => world.characters.some((c) => c.id === s));
    const rows: string[] = [];
    for (const id of ids) {
      const s = getCharacterState(id, frame);
      const feet = project([s.pos[0], s.pos[1], s.pos[2]], pose.pos, pose.lookAt, pose.fov);
      const cloudTop = project([s.cloud.pos[0], s.cloud.pos[1] + 1.2 * s.cloud.size, s.cloud.pos[2]], pose.pos, pose.lookAt, pose.fov);
      const head = project(getAnchor(`${id}.head`, frame), pose.pos, pose.lookAt, pose.fov);
      const h = (cloudTop.y - feet.y) / 2;
      const ok = feet.z > 0 && Math.abs(head.x) < 1 && head.y > -1 && head.y < 1;
      if (!ok) bad++;
      rows.push(`${id}: head(${f2(head.x)},${f2(head.y)}) feet.y=${f2(feet.y)} cloudTop.y=${f2(cloudTop.y)} hFrame=${(h * 100).toFixed(0)}% ${ok ? "" : "<-- DI LUAR FRAME"}`);
    }
    if (frame / FPS >= world.rainbow.appearAt) {
      const c = getRainbowCenter(frame);
      const top = project([c[0], c[1] + world.rainbow.radius, c[2]], pose.pos, pose.lookAt, pose.fov);
      rows.push(`rainbow top.y=${f2(top.y)}`);
    }
    console.log(`  f${frame} cam(${f2(pose.pos[0])},${f2(pose.pos[1])},${f2(pose.pos[2])}) fov ${pose.fov.toFixed(1)} t=${(frame / FPS).toFixed(1)}s`);
    rows.forEach((x) => console.log("     " + x));
  }
}
console.log(bad ? `\n${bad} sampel subjek di luar frame` : "\nSemua subjek utama masuk frame.");
