// Pembaca data JSON. Kode tidak hard-code cerita: semua dibaca dari public/*.json.
import worldJson from "../../public/world.json";
import cameraJson from "../../public/camera.json";
import timingJson from "../../public/timing.json";
import type { CameraData, TimingData, WorldData } from "./types";

export const FPS = 30;
export const timing = timingJson as unknown as TimingData;
export const world = worldJson as unknown as WorldData;
export const cameraData = cameraJson as unknown as CameraData;

export const TOTAL_FRAMES = Math.ceil(timing.totalSeconds * FPS);
