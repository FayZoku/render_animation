// npm run timing  ->  public/timing.json dari input/narasi.srt + durasi public/narasi.mp3
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { buildWords } from "../src/subtitle/words";

const root = path.resolve(__dirname, "..");
const srtPath = path.join(root, "input", "narasi.srt");
const mp3Path = path.join(root, "public", "narasi.mp3");
const fixPath = path.join(root, "input", "koreksi.json");
const outPath = path.join(root, "public", "timing.json");

function toSec(h: string, m: string, s: string, ms: string): number {
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms.padEnd(3, "0").slice(0, 3)) / 1000;
}

function parseSrt(src: string) {
  const blocks = src.replace(/\r/g, "").trim().split(/\n\s*\n/);
  const out: { start: number; end: number; text: string }[] = [];
  for (const b of blocks) {
    const lines = b.split("\n").map((l) => l.trim()).filter(Boolean);
    const ti = lines.findIndex((l) => l.includes("-->"));
    if (ti < 0) continue;
    const m = lines[ti].match(/(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/);
    if (!m) continue;
    out.push({
      start: toSec(m[1], m[2], m[3], m[4]),
      end: toSec(m[5], m[6], m[7], m[8]),
      text: lines.slice(ti + 1).join(" "),
    });
  }
  return out;
}

function applyFixes(text: string): string {
  if (!fs.existsSync(fixPath)) return text;
  const fixes = JSON.parse(fs.readFileSync(fixPath, "utf8")) as Record<string, string>;
  let t = text;
  for (const [k, v] of Object.entries(fixes)) {
    if (k.startsWith("_")) continue;
    const re = new RegExp(`(?<![\\p{L}])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}])`, "giu");
    t = t.replace(re, (hit) => (/^\p{Lu}/u.test(hit) ? v.charAt(0).toUpperCase() + v.slice(1) : v));
  }
  return t;
}

function mp3Duration(file: string): number {
  try {
    const o = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" });
    const d = parseFloat(o.trim());
    if (Number.isFinite(d)) return d;
  } catch {
    /* lanjut ke fallback */
  }
  try {
    const req = createRequire(__filename);
    const mm = req("music-metadata");
    if (mm.parseFileSync) return mm.parseFileSync(file).format.duration;
  } catch {
    /* tidak tersedia */
  }
  throw new Error("Tidak bisa membaca durasi mp3. Pasang ffprobe (paket ffmpeg) lalu jalankan ulang `npm run timing`.");
}

const entries = parseSrt(fs.readFileSync(srtPath, "utf8"));
if (entries.length === 0) throw new Error("input/narasi.srt kosong atau formatnya tidak dikenali");
const duration = mp3Duration(mp3Path);
const totalSeconds = Math.round((duration + 1) * 1000) / 1000;

const scenes = entries.map((e, i) => {
  const text = applyFixes(e.text);
  return {
    id: i + 1,
    start: Math.round(e.start * 1000) / 1000,
    end: Math.round(e.end * 1000) / 1000,
    text,
    words: buildWords(text, e.start, e.end),
  };
});

fs.writeFileSync(outPath, JSON.stringify({ totalSeconds, scenes }, null, 2) + "\n");
console.log(`timing.json: ${scenes.length} adegan, narasi ${duration.toFixed(3)}s, total ${totalSeconds}s`);
