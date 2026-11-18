// Validasi saat load: error yang jelas bila data tidak konsisten.
import { cameraData, timing, world } from "./data";
import { isKnownAnchor } from "./anchors";
import { EXPRESSIONS } from "./types";

let done = false;

export function validateAll(): void {
  if (done) return;
  done = true;
  const errs: string[] = [];

  // --- timing & adegan
  if (!(timing.totalSeconds > 0)) errs.push("timing.json: totalSeconds harus > 0");
  if (timing.scenes.length === 0) errs.push("timing.json: tidak ada adegan");
  if (world.scenes.length !== timing.scenes.length)
    errs.push(`world.json: jumlah scenes (${world.scenes.length}) != jumlah adegan timing.json (${timing.scenes.length})`);

  // --- kamera
  if (cameraData.shots.length !== timing.scenes.length)
    errs.push(`camera.json: jumlah shot (${cameraData.shots.length}) != jumlah adegan (${timing.scenes.length}). Harus satu shot per adegan.`);
  cameraData.shots.forEach((s, i) => {
    const tag = `camera.json shot #${i + 1} (sceneId ${s.sceneId})`;
    if (timing.scenes[i] && s.sceneId !== timing.scenes[i].id) errs.push(`${tag}: sceneId harus ${timing.scenes[i].id}`);
    if (!Array.isArray(s.keyframes) || s.keyframes.length < 2) errs.push(`${tag}: minimal 2 keyframe`);
    else {
      let prev = -Infinity;
      s.keyframes.forEach((k, j) => {
        const kt = `${tag} keyframe ${j}`;
        if (typeof k.t !== "number" || k.t < 0 || k.t > 1) errs.push(`${kt}: t harus 0..1`);
        if (k.t <= prev) errs.push(`${kt}: t harus naik berurutan`);
        prev = k.t;
        if (!Array.isArray(k.pos) || k.pos.length !== 3 || k.pos.some((v) => typeof v !== "number" || !Number.isFinite(v)))
          errs.push(`${kt}: pos harus [x,y,z] angka`);
        if (!Array.isArray(k.lookAt) || k.lookAt.length !== 3 || k.lookAt.some((v) => typeof v !== "number" || !Number.isFinite(v)))
          errs.push(`${kt}: lookAt harus [x,y,z] angka`);
        if (typeof k.fov !== "number" || k.fov < 10 || k.fov > 90) errs.push(`${kt}: fov harus 10..90`);
      });
    }
    if (s.anchor && !isKnownAnchor(s.anchor)) errs.push(`${tag}: anchor "${s.anchor}" tidak dikenal`);
    if (s.roll !== undefined && Math.abs(s.roll) >= 3) errs.push(`${tag}: roll harus < 3 derajat`);
    if (s.lag !== undefined && (s.lag < 4 || s.lag > 8)) errs.push(`${tag}: lag harus 4..8 frame`);
  });

  // --- dunia
  const ids = new Set<string>();
  for (const c of world.characters) {
    if (ids.has(c.id)) errs.push(`world.json: id tokoh ganda "${c.id}"`);
    ids.add(c.id);
    if (!c.path || c.path.length === 0) errs.push(`world.json: tokoh "${c.id}" tanpa path`);
    if (c.partner && !world.characters.some((x) => x.id === c.partner)) errs.push(`world.json: partner "${c.partner}" milik "${c.id}" tidak ada`);
    if (c.repel && !world.characters.some((x) => x.id === c.repel!.from)) errs.push(`world.json: repel.from "${c.repel.from}" milik "${c.id}" tidak ada`);
  }
  for (const sc of world.scenes) {
    for (const e of sc.expr ?? []) {
      if (!ids.has(e.id)) errs.push(`world.json scene ${sc.id}: tokoh "${e.id}" tidak ada`);
      if (!EXPRESSIONS.includes(e.expr)) errs.push(`world.json scene ${sc.id}: ekspresi "${e.expr}" tidak valid`);
    }
  }
  if (!isKnownAnchor(world.rainbow.center)) errs.push(`world.json: rainbow.center "${world.rainbow.center}" bukan anchor`);

  if (errs.length) throw new Error("Validasi data gagal:\n - " + errs.join("\n - "));
}
