// PRNG ber-seed. Math.random() dilarang di seluruh project.
export function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeRng(seed: number | string): Rng {
  return mulberry32(typeof seed === "string" ? hashString(seed) : seed);
}

export const rngRange = (r: Rng, a: number, b: number) => a + (b - a) * r();
export const rngPick = <T,>(r: Rng, list: readonly T[]): T => list[Math.floor(r() * list.length) % list.length];
