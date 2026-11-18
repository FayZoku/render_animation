// Penampilan acak ber-seed per tokoh (deterministik; tanpa Math.random).
import { ACCENT_COLORS, HAIRS, PANTS, SHIRTS, SHOES, SKINS } from "../world/palette";
import { hashString, makeRng, rngPick } from "../world/prng";
import type { Accessory, CharacterDef, HairStyle, LookSpec } from "../world/types";

export const HAIR_STYLES: HairStyle[] = ["spiky", "bob", "curly", "bun", "mohawk", "bald"];
export const ACCESSORIES: Accessory[] = ["none", "headband", "bow"];

export interface Look {
  hair: HairStyle;
  hairColor: string;
  skin: string;
  shirt: string;
  pants: string;
  shoes: string;
  accessory: Accessory;
  accessoryColor: string;
  pattern: "none" | "stripe" | "pocket";
}

export function makeLook(def: CharacterDef): Look {
  const rng = makeRng(hashString(def.id) + (def.seed ?? 0) * 7919);
  const o: LookSpec = def.look ?? {};
  const hair = o.hair ?? rngPick(rng, HAIR_STYLES);
  const accessory = o.accessory ?? (hair === "bald" || hair === "mohawk" ? "none" : rngPick(rng, ["none", "none", "headband", "bow"] as Accessory[]));
  return {
    hair,
    hairColor: o.hairColor ?? rngPick(rng, HAIRS),
    skin: o.skin ?? rngPick(rng, SKINS),
    shirt: o.shirt ?? rngPick(rng, SHIRTS),
    pants: o.pants ?? rngPick(rng, PANTS),
    shoes: o.shoes ?? rngPick(rng, SHOES),
    accessory,
    accessoryColor: o.accessoryColor ?? rngPick(rng, ACCENT_COLORS),
    pattern: o.pattern ?? rngPick(rng, ["none", "none", "stripe", "pocket"] as const),
  };
}
