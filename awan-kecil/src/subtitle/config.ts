// Semua pengaturan subtitle ada di sini.
export const SUBTITLE = {
  /** ukuran font maksimum (px) pada kanvas 1080x1920 */
  fontSize: 128,
  /** tebal stroke hitam yang TERLIHAT di luar huruf (px). Di SVG dipakai 2x karena stroke dilukis di bawah isi huruf. */
  strokeWidth: 12,
  /** jarak tepi bawah kotak subtitle dari tepi bawah video (px); aman vertikal 260-340 */
  bottomMargin: 300,
  /** margin samping minimum (px) */
  sideMargin: 80,
  /** tinggi kotak (transparan) tempat teks dipusatkan */
  boxHeight: 260,
  /** true = HURUF BESAR, false = Huruf Kecil seperti naskah */
  uppercase: true,
  /** perkiraan lebar rata-rata huruf (relatif ukuran font) untuk pengecilan otomatis */
  avgCharWidth: 0.74,
  /** durasi pop-in (frame) dan skala awal */
  popFrames: 4,
  popFrom: 0.85,
  fill: "#FFFFFF",
  stroke: "#000000",
} as const;

export const END_CARD = {
  text: "Cukup temani.",
  fontSize: 150,
  strokeWidth: 12,
  /** posisi pusat teks dari atas (px): sepertiga atas layar */
  centerY: 560,
  /** detik sejak awal adegan terakhir */
  appearAfter: 0.9,
} as const;
