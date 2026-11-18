import { FPS, TOTAL_FRAMES, timing } from "./data";

export interface SceneRange {
  index: number;
  id: number;
  /** detik */
  start: number;
  end: number;
  startFrame: number;
  /** eksklusif */
  endFrame: number;
}

/**
 * Rentang kamera/adegan: adegan i berjalan dari awal-nya sampai awal adegan berikutnya
 * (jeda kecil di SRT tidak menyisakan lubang). Adegan pertama mulai di 0, terakhir sampai akhir video.
 */
export const sceneRanges: SceneRange[] = timing.scenes.map((s, i, arr) => {
  const startFrame = i === 0 ? 0 : Math.round(s.start * FPS);
  const endFrame = i === arr.length - 1 ? TOTAL_FRAMES : Math.round(arr[i + 1].start * FPS);
  return {
    index: i,
    id: s.id,
    start: startFrame / FPS,
    end: endFrame / FPS,
    startFrame,
    endFrame,
  };
});

export function sceneIndexAt(frame: number): number {
  for (let i = sceneRanges.length - 1; i >= 0; i--) {
    if (frame >= sceneRanges[i].startFrame) return i;
  }
  return 0;
}
