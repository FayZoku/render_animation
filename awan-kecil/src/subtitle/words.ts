// Pembagi kata per kata. Tanpa import React/Remotion agar bisa dipakai skrip Node.
export interface WordTiming {
  w: string;
  start: number;
  end: number;
}

const letters = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, "").length;
const round3 = (v: number) => Math.round(v * 1000) / 1000;

/**
 * Aturan: durasi adegan dibagi ke tiap kata sebanding jumlah karakter.
 * Tanda baca ikut kata sebelumnya; koma/titik menambah bobot (jeda kecil) pada kata itu,
 * sehingga tidak ada jeda kosong dalam satu adegan. Kata sangat pendek (<=2 huruf) digabung
 * dengan kata berikutnya (maks dua kata tampil bersamaan).
 */
export function buildWords(text: string, start: number, end: number): WordTiming[] {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  const entries: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const next = tokens[i + 1];
    if (next !== undefined && letters(tok) <= 2 && !/[,.!?;:]$/.test(tok) && letters(next) <= 6) {
      entries.push(`${tok} ${next}`);
      i++;
    } else entries.push(tok);
  }
  const weights = entries.map((e, i) => {
    let wgt = e.length;
    if (i < entries.length - 1) {
      if (/[,;:]$/.test(e)) wgt += 2.5;
      else if (/[.!?]$/.test(e)) wgt += 4.5;
    }
    return wgt;
  });
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const dur = end - start;
  let cursor = start;
  return entries.map((w, i) => {
    const s = cursor;
    const e = i === entries.length - 1 ? end : cursor + (dur * weights[i]) / sum;
    cursor = e;
    return { w, start: round3(s), end: round3(e) };
  });
}
