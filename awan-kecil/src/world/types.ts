// Tipe data untuk world.json, camera.json, dan timing.json.
export type Vec3 = [number, number, number];

export type Expression = "happy" | "sad" | "shock" | "determined";
export const EXPRESSIONS: Expression[] = ["happy", "sad", "shock", "determined"];

export type Act = "auto" | "walk" | "idle" | "cover" | "hop" | "laugh" | "shock";
export type EaseName = "linear" | "in" | "out" | "inOut";

export type HairStyle = "spiky" | "bob" | "curly" | "bun" | "mohawk" | "bald";
export type Accessory = "none" | "headband" | "bow";

export interface PathKey {
  /** detik dari awal video */
  t: number;
  /** [x, z] posisi kaki di dunia */
  pos: [number, number];
  /** derajat; 0 = menghadap +z, 90 = menghadap +x, 180 = menghadap -z */
  yaw?: number;
  /** aksi untuk segmen mulai keyframe ini sampai keyframe berikutnya */
  act?: Act;
  /** easing posisi segmen ini (kf ini -> kf berikutnya) */
  ease?: EaseName;
}

export interface CloudKey {
  t: number;
  /** 0 = awan badai gelap, 1 = awan putih cerah */
  mood: number;
  /** 0..1 intensitas hujan */
  rain: number;
  size?: number;
  /** 0..1 pendar hangat (memakai cloudTint) */
  glow?: number;
  /** 0..1 menyatu ke titik tengah dengan `partner` */
  merge?: number;
}

export interface LookSpec {
  hair?: HairStyle;
  hairColor?: string;
  skin?: string;
  shirt?: string;
  pants?: string;
  shoes?: string;
  accessory?: Accessory;
  accessoryColor?: string;
  pattern?: "none" | "stripe" | "pocket";
}

export interface RepelSpec {
  from: string;
  radius: number;
  /** jarak geser maksimum pada sumbu z */
  push: number;
  /** +1 geser ke +z, -1 ke -z */
  side: number;
  /** detik: setelah ini tokoh kembali tenang */
  until: number;
  zMin?: number;
  zMax?: number;
}

export interface CharacterDef {
  id: string;
  name?: string;
  role: "hero" | "partner" | "support" | "extra";
  seed?: number;
  scale?: number;
  look?: LookSpec;
  visibleFrom?: number;
  visibleUntil?: number;
  defaultExpr?: Expression;
  path: PathKey[];
  cloud?: CloudKey[];
  cloudTint?: string;
  partner?: string;
  repel?: RepelSpec;
}

export type ObjectType = "building" | "tree" | "lamp" | "bush" | "sign" | "bollard" | "planter";

export interface ObjectDef {
  id: string;
  type: ObjectType;
  /** [x, z] */
  pos: [number, number];
  /** [lebar, tinggi, dalam] */
  size?: [number, number, number];
  color?: string;
  accent?: string;
  /** derajat, kelipatan 90 untuk bangunan (fasad menghadap +z lokal) */
  rot?: number;
  seed?: number;
}

export interface RingSpec {
  seed: number;
  /** bangunan jauh melingkar, radius dalam unit dunia */
  buildings: { count: number; rMin: number; rMax: number };
  /** deretan bangunan jalan utama di luar |x| > streetEnd */
  street: { from: number; to: number };
  fill: { count: number; xRange: number; zMin: number; zMax: number };
  trees: { count: number; rMin: number; rMax: number };
  hills: { count: number; rMin: number; rMax: number };
  skyClouds: { count: number; seed: number };
}

export interface SceneExpr {
  id: string;
  expr: Expression;
  /** detik relatif ke awal adegan, default 0 */
  at?: number;
}

export interface SceneDef {
  id: number;
  summary: string;
  /** anchor utama kamera (informasi) */
  anchor: string;
  env: {
    preset: string;
    weather: string;
    /** angka tunggal atau [awal, akhir] linear sepanjang adegan; <0 = lebih bercahaya */
    dim: number | [number, number];
  };
  /** objek/peristiwa yang muncul pada adegan ini (informasi) */
  reveal?: string[];
  expr?: SceneExpr[];
}

export interface RainbowDef {
  center: string;
  appearAt: number;
  height: number;
  radius: number;
}

export interface WorldData {
  meta: { title: string; units: string; note?: string };
  emotionClouds: boolean;
  characters: CharacterDef[];
  objects: ObjectDef[];
  ring: RingSpec;
  rainbow: RainbowDef;
  scenes: SceneDef[];
}

export interface CameraKey {
  t: number;
  pos: Vec3;
  lookAt: Vec3;
  fov: number;
}

export interface ShotDef {
  sceneId: number;
  type: string;
  anchor?: string | null;
  ease?: EaseName;
  sway?: number;
  /** frame ketertinggalan target anchor (4-8) */
  lag?: number;
  /** detik look-ahead berdasarkan kecepatan anchor */
  lookAhead?: number;
  /** derajat, < 3 */
  roll?: number;
  /** detik durasi transisi masuk (default 0.6) */
  transition?: number;
  note?: string;
  keyframes: CameraKey[];
}

export interface CameraData {
  shots: ShotDef[];
}

export interface WordTimingJson {
  w: string;
  start: number;
  end: number;
}

export interface TimingScene {
  id: number;
  start: number;
  end: number;
  text: string;
  words?: WordTimingJson[];
}

export interface TimingData {
  totalSeconds: number;
  scenes: TimingScene[];
}
