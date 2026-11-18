// Semua warna dikunci di sini (palet pastel hangat). Ubah di sini untuk mengganti seluruh tampilan.
export const PALETTE = {
  pink: "#f2b4c4",
  pinkDeep: "#e79bb0",
  cream: "#f8e8d0",
  creamDeep: "#efd7b6",
  lavender: "#d3c4ea",
  lavenderDeep: "#b9a6dc",
  skyBlue: "#c5def2",
  skyBlueDeep: "#9cc3e6",
  olive: "#a5b67b",
  oliveDeep: "#8ea468",
  oliveLight: "#b8c88f",
  brown: "#8b6248",
  brownLight: "#a97b5a",
  peach: "#f6cdb2",
  butter: "#f7dc8e",
  sage: "#d6e2bd",
  road: "#8d869b",
  roadDark: "#7a7389",
  curb: "#eadbd6",
  sidewalk: "#d8c5c8",
  ground: "#c9cc9f",
  rain: "#a9bde3",
  cloudWhite: "#ffffff",
  cloudStorm: "#80808f",
  glow: "#ffd778",
  glass: "#cdd9ee",
  ink: "#3a2a2e",
} as const;

export const BUILDING_BODIES = [
  "#f3b9c6",
  "#f8e6c9",
  "#d8cbee",
  "#cde2f1",
  "#f4cdb7",
  "#dde7c3",
  "#f0d3df",
  "#e9d9c4",
];
export const AWNING_ACCENTS = ["#f2a7bd", "#c3a4e4", "#9fc8e8", "#f5c28a", "#a9d1a4"];

export const SHIRTS = ["#f2a9bc", "#f7cf8a", "#b9a6e0", "#a9cdee", "#f6b59a", "#b9d3a0", "#f0c2dc", "#e8e2a0"];
export const PANTS = ["#6f7fb5", "#55608a", "#8fb8a0", "#b49ac8", "#7c6f86", "#c9a38a", "#6c8fb8", "#8a8f6a"];
export const SKINS = ["#f2c9a5", "#e8b98f", "#d9a47a", "#c58b62", "#a86f4b", "#8a5638"];
export const HAIRS = ["#5a3d34", "#3b2b2d", "#c98b52", "#e0b46c", "#a44f3a", "#6b4fa0", "#2f2a38", "#8d6a58"];
export const SHOES = ["#4a4052", "#5d4a55", "#6b5a66", "#3f4a5e"];
export const ACCENT_COLORS = ["#f08fb0", "#8fc6ee", "#f3c565", "#b39be0"];

export const MATERIAL = { roughness: 0.72, metalness: 0 } as const;

export interface EnvPreset {
  sunColor: string;
  sunIntensity: number;
  ambColor: string;
  ambIntensity: number;
  skyTop: string;
  skyMid: string;
  skyHor: string;
  fog: string;
  fogNear: number;
  fogFar: number;
  /** arah ke matahari (akan dinormalisasi) */
  sunDir: [number, number, number];
}

export const ENV_PRESETS: Record<string, EnvPreset> = {
  morning: {
    sunColor: "#ffd3a2",
    sunIntensity: 2.7,
    ambColor: "#ffe4de",
    ambIntensity: 2.0,
    skyTop: "#cadaf1",
    skyMid: "#f5d4e1",
    skyHor: "#fde6cb",
    fog: "#f7e1d0",
    fogNear: 60,
    fogFar: 330,
    sunDir: [-0.7, 0.34, -0.55],
  },
  golden: {
    sunColor: "#ffbf86",
    sunIntensity: 2.7,
    ambColor: "#ffd9cf",
    ambIntensity: 1.9,
    skyTop: "#d8c4e8",
    skyMid: "#f6c6d2",
    skyHor: "#ffd9b2",
    fog: "#f8d9c6",
    fogNear: 60,
    fogFar: 330,
    sunDir: [-0.72, 0.28, -0.55],
  },
  evening: {
    sunColor: "#f2a8a0",
    sunIntensity: 1.9,
    ambColor: "#d9c8ee",
    ambIntensity: 1.8,
    skyTop: "#a9a4d8",
    skyMid: "#d9a9cc",
    skyHor: "#f5bfa9",
    fog: "#e5bfc7",
    fogNear: 50,
    fogFar: 300,
    sunDir: [-0.75, 0.16, -0.5],
  },
  night: {
    sunColor: "#9db4ff",
    sunIntensity: 0.9,
    ambColor: "#8da0d8",
    ambIntensity: 1.3,
    skyTop: "#232a55",
    skyMid: "#3b4377",
    skyHor: "#6a6fa4",
    fog: "#4b5287",
    fogNear: 40,
    fogFar: 260,
    sunDir: [-0.4, 0.7, -0.4],
  },
};

/** Cuaca menggeser preset: dim > 0 = muram/mendung, dim < 0 = bercahaya. */
export const GLOOM = {
  sky: "#b9b4cf",
  sun: "#e6dcea",
  amb: "#cfcbe6",
  fog: "#c2bdd2",
};
export const RADIANT = {
  sky: "#ffe0b8",
  sun: "#ffd7a0",
  amb: "#fff0e0",
  fog: "#fbe6d2",
};
