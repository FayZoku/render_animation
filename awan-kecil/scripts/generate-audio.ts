// npm run audio -> sintesis musik latar + SFX (WAV 16-bit mono) ke public/. Tanpa download, deterministik.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const SR = 44100;
const timing = JSON.parse(fs.readFileSync(path.join(root, "public", "timing.json"), "utf8")) as { totalSeconds: number };

// PRNG ber-seed (LCG/mulberry)
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function writeWav(file: string, data: Float32Array) {
  let peak = 0;
  for (const v of data) peak = Math.max(peak, Math.abs(v));
  const g = peak > 0.95 ? 0.95 / peak : 1;
  const buf = Buffer.alloc(44 + data.length * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + data.length * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(data.length * 2, 40);
  for (let i = 0; i < data.length; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, data[i] * g)) * 32767), 44 + i * 2);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
  console.log("tulis", path.relative(root, file), (data.length / SR).toFixed(2) + "s");
}

const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

function addPluck(out: Float32Array, start: number, midi: number, dur: number, vol: number, seed: number) {
  const f = hz(midi);
  const N = Math.max(2, Math.round(SR / f));
  const buf = new Float32Array(N);
  const r = rng(seed);
  for (let i = 0; i < N; i++) buf[i] = r() * 2 - 1;
  const s0 = Math.floor(start * SR);
  const len = Math.floor(dur * SR);
  let idx = 0;
  for (let i = 0; i < len && s0 + i < out.length; i++) {
    const nx = (idx + 1) % N;
    const v = buf[idx];
    buf[idx] = 0.4985 * (buf[idx] + buf[nx]);
    out[s0 + i] += v * vol * Math.min(1, i / 60) * Math.exp(-i / (SR * dur * 0.55));
    idx = nx;
  }
}

function addPiano(out: Float32Array, start: number, midi: number, dur: number, vol: number) {
  const f = hz(midi);
  const s0 = Math.floor(start * SR);
  const len = Math.floor(dur * SR);
  for (let i = 0; i < len && s0 + i < out.length; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.008) * Math.exp(-t * 2.4);
    const v = Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * f * 2 * t) * Math.exp(-t * 3) + 0.12 * Math.sin(2 * Math.PI * f * 3.01 * t) * Math.exp(-t * 5);
    out[s0 + i] += v * env * vol;
  }
}

function addPad(out: Float32Array, start: number, midis: number[], dur: number, vol: number) {
  const s0 = Math.floor(start * SR);
  const len = Math.floor(dur * SR);
  for (let i = 0; i < len && s0 + i < out.length; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.9) * Math.min(1, (dur - t) / 0.9);
    let v = 0;
    for (const m of midis) v += Math.sin(2 * Math.PI * hz(m) * t) + 0.3 * Math.sin(2 * Math.PI * hz(m) * 1.003 * t + 1);
    out[s0 + i] += (v / midis.length) * env * vol;
  }
}

function music() {
  const dur = timing.totalSeconds + 2;
  const out = new Float32Array(Math.floor(dur * SR));
  const bpm = 78;
  const beat = 60 / bpm;
  const bar = beat * 4;
  // C - Am - F - G (pelan, hangat)
  const prog = [
    { root: 48, tri: [60, 64, 67, 72] },
    { root: 45, tri: [57, 60, 64, 69] },
    { root: 53, tri: [60, 65, 69, 72] },
    { root: 43, tri: [59, 62, 67, 71] },
  ];
  const bars = Math.ceil(dur / bar);
  const arp = [0, 1, 2, 3, 2, 1, 2, 3];
  for (let b = 0; b < bars; b++) {
    const ch = prog[b % 4];
    const t0 = b * bar;
    addPad(out, t0, [ch.tri[0], ch.tri[1], ch.tri[2]], bar + 0.4, 0.05);
    addPiano(out, t0, ch.root, bar * 0.9, 0.22);
    addPiano(out, t0 + beat * 2, ch.root + 7, beat * 2, 0.12);
    for (let i = 0; i < 8; i++) addPluck(out, t0 + i * (beat / 2), ch.tri[arp[i]], 0.9, 0.2, 1000 + b * 8 + i);
    // melodi pentatonik jarang
    if (b % 2 === 1) {
      const mel = [76, 79, 81, 79, 76, 74];
      for (let i = 0; i < 3; i++) addPiano(out, t0 + beat * (i * 1.5 + 0.5), mel[(b + i) % mel.length], 1.4, 0.1);
    }
  }
  const fi = 1.5 * SR;
  const fo = 2.5 * SR;
  for (let i = 0; i < out.length; i++) {
    out[i] *= Math.min(1, i / fi) * Math.min(1, (out.length - i) / fo);
  }
  writeWav(path.join(root, "public", "musik.wav"), out);
}

function whoosh() {
  const dur = 0.75;
  const out = new Float32Array(Math.floor(dur * SR));
  const r = rng(11);
  let lp = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const k = Math.sin((Math.PI * i) / out.length);
    const cutoff = 0.02 + 0.45 * Math.pow(k, 1.5);
    lp += cutoff * (r() * 2 - 1 - lp);
    out[i] = lp * 2.2 * Math.pow(k, 1.3) * (1 + 0.2 * Math.sin(t * 40));
  }
  writeWav(path.join(root, "public", "sfx", "whoosh.wav"), out);
}

function ting() {
  const out = new Float32Array(Math.floor(1.6 * SR));
  const partials = [
    [1, 1],
    [2.76, 0.45],
    [5.4, 0.25],
    [8.93, 0.12],
  ];
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    let v = 0;
    for (const [m, a] of partials) v += a * Math.sin(2 * Math.PI * 1568 * m * t) * Math.exp(-t * (2.5 + m * 1.2));
    out[i] = v * Math.min(1, t / 0.003) * 0.5;
  }
  writeWav(path.join(root, "public", "sfx", "ting.wav"), out);
}

function pop() {
  const out = new Float32Array(Math.floor(0.14 * SR));
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const f = 400 + 700 * Math.exp(-t * 40);
    out[i] = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 32) * 0.7;
  }
  writeWav(path.join(root, "public", "sfx", "pop.wav"), out);
}

function sparkle() {
  const out = new Float32Array(Math.floor(1.0 * SR));
  [2093, 2637, 3136, 4186].forEach((f, k) => {
    const s0 = Math.floor(k * 0.09 * SR);
    for (let i = 0; s0 + i < out.length && i < 0.6 * SR; i++) {
      const t = i / SR;
      out[s0 + i] += Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 7) * 0.25;
    }
  });
  writeWav(path.join(root, "public", "sfx", "sparkle.wav"), out);
}

/** Hujan: derau lembut + tetesan acak; ujung di-crossfade agar bisa diulang mulus. */
function rain() {
  const dur = 6;
  const n = Math.floor(dur * SR);
  const xf = Math.floor(0.4 * SR);
  const raw = new Float32Array(n + xf);
  const r = rng(77);
  let lp1 = 0;
  let lp2 = 0;
  for (let i = 0; i < raw.length; i++) {
    const w = r() * 2 - 1;
    lp1 += 0.35 * (w - lp1);
    lp2 += 0.05 * (w - lp2);
    raw[i] = (lp1 - lp2) * 0.35;
  }
  const drops = Math.floor(dur * 55);
  for (let d = 0; d < drops; d++) {
    const s0 = Math.floor(r() * n);
    const f = 1800 + r() * 2600;
    const a = 0.05 + r() * 0.12;
    for (let i = 0; i < 700 && s0 + i < raw.length; i++) raw[s0 + i] += Math.sin(2 * Math.PI * f * (i / SR)) * Math.exp(-i / 90) * a;
  }
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = raw[i];
    if (i < xf) {
      const k = i / xf;
      out[i] = raw[i] * k + raw[n + i] * (1 - k);
    }
  }
  writeWav(path.join(root, "public", "sfx", "rain.wav"), out);
}

/** Langkah: dua ketukan lembut per siklus 1.2 s (bisa diulang). */
function steps() {
  const dur = 1.2;
  const out = new Float32Array(Math.floor(dur * SR));
  const r = rng(5);
  for (const t0 of [0.0, 0.6]) {
    const s0 = Math.floor(t0 * SR);
    for (let i = 0; i < 0.16 * SR && s0 + i < out.length; i++) {
      const t = i / SR;
      out[s0 + i] += Math.sin(2 * Math.PI * (95 - 40 * t) * t) * Math.exp(-t * 28) * 0.7 + (r() * 2 - 1) * Math.exp(-t * 90) * 0.12;
    }
  }
  writeWav(path.join(root, "public", "sfx", "steps.wav"), out);
}

music();
whoosh();
ting();
pop();
sparkle();
rain();
steps();
