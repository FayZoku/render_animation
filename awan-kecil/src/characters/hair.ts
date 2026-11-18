// Model rambut dari kotak kecil (koordinat lokal terhadap pusat kepala 1.5 x 1.4 x 1.4).
import type { BoxSpec } from "../world/townData";
import { shadeHex } from "../world/math";
import { makeRng, rngRange } from "../world/prng";
import type { Accessory, HairStyle } from "../world/types";

export function hairBoxes(style: HairStyle, color: string, seed: number): BoxSpec[] {
  const rng = makeRng(seed);
  const c = color;
  const dark = shadeHex(color, -0.1);
  const out: BoxSpec[] = [];
  const cap = (): BoxSpec => ({ p: [0, 0.62, -0.02], s: [1.62, 0.46, 1.54], c, r: 0.2 });
  switch (style) {
    case "bald":
      break;
    case "bob":
      out.push(cap());
      out.push({ p: [0, 0.1, -0.6], s: [1.62, 1.05, 0.5], c, r: 0.2 });
      out.push({ p: [-0.8, 0.12, -0.1], s: [0.26, 0.95, 1.2], c: dark, r: 0.1 });
      out.push({ p: [0.8, 0.12, -0.1], s: [0.26, 0.95, 1.2], c: dark, r: 0.1 });
      out.push({ p: [0, 0.5, 0.7], s: [1.52, 0.34, 0.2], c, r: 0.08 }); // poni rata
      break;
    case "spiky":
      out.push(cap());
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const rx = Math.cos(a) * 0.5;
        const rz = Math.sin(a) * 0.45;
        out.push({
          p: [rx, 0.98 + rng() * 0.1, rz],
          s: [0.34, 0.5 + rng() * 0.3, 0.34],
          c: i % 2 ? c : dark,
          r: 0.06,
          rz: -rx * 0.8,
          rx: rz * 0.8,
        });
      }
      out.push({ p: [0.1, 0.62, 0.62], s: [0.9, 0.3, 0.3], c, r: 0.06, rz: 0.15 });
      break;
    case "curly":
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        out.push({ p: [Math.cos(a) * 0.62, 0.7 + rng() * 0.1, Math.sin(a) * 0.58 - 0.05], s: [0.5, 0.46, 0.5], c: i % 3 === 0 ? dark : c, r: 0.15 });
      }
      for (let i = 0; i < 4; i++) {
        out.push({ p: [rngRange(rng, -0.3, 0.3), 0.98, rngRange(rng, -0.3, 0.3)], s: [0.5, 0.42, 0.5], c, r: 0.15 });
      }
      out.push({ p: [0, 0.2, -0.66], s: [1.2, 0.7, 0.34], c: dark, r: 0.12 });
      break;
    case "bun":
      out.push(cap());
      out.push({ p: [0, 0.25, -0.62], s: [1.58, 0.8, 0.4], c, r: 0.16 });
      out.push({ p: [0, 1.05, -0.35], s: [0.62, 0.55, 0.62], c: dark, r: 0.2 });
      out.push({ p: [0, 0.62, 0.68], s: [1.2, 0.26, 0.18], c, r: 0.06 });
      break;
    case "mohawk":
      for (let i = 0; i < 5; i++) {
        out.push({ p: [0, 0.84 + (i === 2 ? 0.15 : i === 1 || i === 3 ? 0.08 : 0), 0.5 - i * 0.28], s: [0.3, 0.42 + (i === 2 ? 0.2 : 0), 0.3], c: i % 2 ? c : dark, r: 0.08 });
      }
      out.push({ p: [0, 0.74, 0], s: [0.7, 0.14, 1.4], c, r: 0.05 });
      break;
  }
  return out;
}

export function accessoryBoxes(acc: Accessory, color: string): BoxSpec[] {
  if (acc === "headband") return [{ p: [0, 0.42, -0.02], s: [1.62, 0.16, 1.52], c: color, r: 0.06 }];
  if (acc === "bow")
    return [
      { p: [-0.55, 0.95, 0.35], s: [0.32, 0.26, 0.2], c: color, r: 0.06, rz: 0.3 },
      { p: [-0.9, 0.95, 0.35], s: [0.32, 0.26, 0.2], c: color, r: 0.06, rz: -0.3 },
      { p: [-0.72, 0.95, 0.36], s: [0.14, 0.14, 0.2], c: color, r: 0.04 },
    ];
  return [];
}
