# Awan Kecil — animasi 3D blocky pastel (Remotion + React Three Fiber)

1080×1920 (9:16), 30 fps. Durasi = narasi 54,204 s + 1 s = **55,204 s (1657 frame)**, dihitung dari `public/narasi.mp3`.

## Cara pakai

```bash
npm install
npm run render        # hasil: out/video.mp4  (flag: --gl=angle)
```

Opsional: `npm run studio` (pratinjau di Remotion Studio), `npm run typecheck`, `npm run check` (lihat bawah).
File `timing.json`, `musik.wav`, dan `sfx/*.wav` sudah ikut di zip. Jalankan ulang hanya bila narasi/SRT berubah:

```bash
npm run timing        # input/narasi.srt + public/narasi.mp3 -> public/timing.json
npm run audio         # sintesis musik + SFX -> public/musik.wav, public/sfx/*.wav
```

> **Catatan jujur tentang verifikasi.** Project ini ditulis tanpa akses internet, jadi `npm install`, `npx tsc --noEmit` dengan tipe asli (three, remotion, R3F), dan render **belum pernah dijalankan**. Yang sudah dijalankan: type-check kode sendiri terhadap deklarasi tiruan (bersih), `npm run timing`, `npm run audio`, `npm run check` (proyeksi kamera), dan uji 1657 frame untuk NaN/lompatan kamera. Jalankan `npm run typecheck` sekali setelah `npm install`; bila ada ketidakcocokan tipe versi library, perbaikannya kecil dan lokal. Versi dipin: remotion & semua `@remotion/*` 4.0.250 (harus identik), react 18.3.1, three 0.169.0 + @types/three 0.169.0, @react-three/fiber 8.17.10. Bila salah satu versi tidak ditemukan npm, ganti bersamaan ke versi terdekat yang kompatibel. Tampilan akhir juga belum pernah dilihat; angka kamera divalidasi secara matematis, bukan visual.

## Struktur

```
input/            naskah.txt, narasi.srt, koreksi.json, screenshot/gaya-*.jpg (referensi gaya)
public/           narasi.mp3, timing.json, camera.json, world.json, musik.wav, sfx/
scripts/          srt-to-timing.ts, generate-audio.ts, check-camera.ts
src/Root.tsx, Video.tsx, index.ts
src/world/        palette, anchors.ts, camera.ts, env.ts, town.ts, blocks.ts, Sky, Ground, Town, Lighting, CameraRig, Clouds, Rainbow, validate.ts
src/characters/   Character.tsx, face.ts, hair.ts, look.ts (generator ber-seed)
src/scenes/       Stage.tsx (data-driven dari world.json)
src/subtitle/     Subtitle.tsx, EndCard.tsx, config.ts, words.ts
src/audio/        AudioTrack.tsx
```

## Mengedit

### timing.json
```json
{ "totalSeconds": 55.204, "scenes": [ { "id": 1, "start": 0, "end": 6, "text": "…",
  "words": [ { "w": "In this", "start": 0, "end": 0.571 } ] } ] }
```
Edit `start`/`end` per kata langsung (detik). Bila `words` dihapus, komponen subtitle menghitung sendiri dengan aturan yang sama (`src/subtitle/words.ts`): durasi adegan dibagi sebanding jumlah karakter; tanda baca ikut kata sebelumnya; koma/titik memperpanjang kata itu (jeda kecil tanpa lubang kosong); kata ≤2 huruf digabung dengan kata berikutnya (maks 2 kata). Salah-ketik SRT diperbaiki lewat `input/koreksi.json` (mis. "grimis"→"gerimis", "teman idea"→"temani dia") sebelum `npm run timing`.

### camera.json
Satu shot per adegan (divalidasi saat load; error jelas bila jumlah shot ≠ jumlah adegan atau keyframe tidak valid).
`type` (informasi; `follow` otomatis memberi look-ahead), `anchor` (string dari `anchors.ts` atau `null`), `ease` (`linear|in|out|inOut`), `sway` (napas halus), `lag` (4–8 frame, default 6), `lookAhead` (detik), `roll` (<3°), `transition` (detik, default 0,6), `keyframes[{t,pos,lookAt,fov}]` (t = progres adegan 0–1, min. 2, Catmull-Rom). Bila `anchor` diisi, `pos`/`lookAt` adalah **offset sumbu dunia** dari anchor; bila `null`, koordinat dunia. Contoh:
```json
{ "sceneId": 3, "type": "follow", "anchor": "raka", "ease": "inOut", "sway": 0.3,
  "keyframes": [ { "t": 0, "pos": [-5.5,0.5,-10], "lookAt": [2.4,1.5,0.5], "fov": 40 },
                 { "t": 1, "pos": [3.8,1.2,-9.6],  "lookAt": [0.4,1.7,0.3], "fov": 36 } ] }
```
Rentang adegan = dari awal adegan itu sampai awal adegan berikutnya (jeda 46–47 s di SRT tidak menyisakan lubang). Anchor diikuti dengan peredaman: rata-rata target dari frame tertinggal (lag ±2). Transisi masuk memadukan pose akhir shot sebelumnya (yang sebenarnya, terus bergerak) ke shot baru dengan easing halus, jalur sudut terpendek.

### world.json
- `emotionClouds` (bool): lihat Asumsi #1.
- `characters[]`: `id, role (hero|partner|support|extra), scale, seed, look{hair,hairColor,skin,shirt,pants,shoes,accessory,accessoryColor,pattern}`, `visibleFrom/Until` (detik), `defaultExpr`, `path[]` (`t` detik, `pos [x,z]`, `yaw` derajat — 0 = +z, 90 = +x, 180 = −z, `act`, `ease`), `cloud[]` (`t, mood 0 badai–1 cerah, rain 0–1, size, glow, merge`), `cloudTint`, `partner`, `repel{from,radius,push,side,until,zMin,zMax}` (tokoh menyingkir & menutup kepala saat `from` berhujan). Langkah kaki mengikuti jarak tempuh (tanpa sliding); kecepatan nol = diam.
- `objects[]`: `type` (building, tree, lamp, bush, sign, bollard, planter), `pos [x,z]`, `size [w,h,d]` (tree: `size[1]` = skala), `color`, `accent` (warna kanopi), `rot` (derajat, kelipatan 90; fasad menghadap +z lokal).
- `ring`: cincin kota jauh/bukit/pohon/awan langit ber-seed (dunia melingkar, tanpa tepi).
- `rainbow`: `center` (anchor), `appearAt` (detik), `height`, `radius`.
- `scenes[]`: `env{preset, weather, dim}` (preset `morning|golden|evening|night`; `dim` >0 muram, <0 bercahaya; boleh `[awal,akhir]`), `expr[{id,expr,at}]` (ekspresi `happy|sad|shock|determined`, `at` detik relatif adegan), `anchor`, `reveal`, `summary`.

Koordinat: x sepanjang jalan, z melintang (jalan |z|<3, trotoar 3–9, fasad bangunan di |z|=9), y atas. Tokoh ≈ 3,7 unit.

### Subtitle, font, palet
- `src/subtitle/config.ts`: `fontSize` (128), `strokeWidth` (12 px terlihat; SVG memakai 2× karena stroke dilukis di bawah isi), `bottomMargin` (300), `sideMargin` (80), `uppercase`, `popFrames`. Kata panjang mengecil otomatis. Teks akhir "Cukup temani." di `END_CARD` (sepertiga atas).
- Palet dikunci di `src/world/palette.ts` (warna bangunan/kanopi, baju, celana, kulit, rambut, preset cahaya & langit).

## Satu baris per adegan (isi dunia · shot · sudut · alasan)

1. **0–6 s** Kota pagi, kerumunan berjalan dengan awan cerah · pull-back crane, miring (establishing, FOV 46→58) · dari rendah dekat lajur pejalan ke tinggi · membuka dunia "setiap orang punya awan".
2. **6–13** Dino tertawa (awan putih) → Mira muram, awan menggelap & hujan · push-in/pan 3 keyframe · low-angle ke Dino → dua-shot → high-angle ke Mira · sudut rendah = riang, tinggi = sedih.
3. **13–22** Raka berjalan sendirian, hujan terus; Dino/Mira/pejalan menyingkir menutup kepala · follow dengan look-ahead, orbit ke depan · rendah depan-kiri → depan · wajah murung terbaca.
4. **22–28** Luna keluar dari gang, awan kuning hangat + "ting" · tracking rendah mengikuti Luna · dari samping-depan sampai Raka masuk frame · menyatukan dua tokoh.
5. **28–35** Luna berdiri di samping Raka, ikut hujan · orbit ±45° dua-shot · kiri → depan → kanan · kebersamaan.
6. **35–41** Awan Raka menipis → gerimis → reda · crane-up (FOV 40→38) · dari rendah naik ke awan · fokus pada perubahan awan.
7. **41–47** Dua awan menyatu, pelangi voxel pop-in · orbit lebar sambil naik, medium-wide · pelangi di belakang awan, menghadap kamera.
8. **47–51** Berjalan berdampingan · tracking samping medium dengan look-ahead · dari sisi jalan · "cukup temani" sebagai gerak bersama.
9. **51–55** Pull-back crane miring ke shot luas kota + teks "Cukup temani." · FOV 42→58 · tinggi di atas jalan, miring · penutup (shot luas hanya adegan 1 dan 9).

## Anchor, rambut, aksesori

- Anchor: `raka`, `luna`, `dino`, `mira`, `e01`…`e10` (dada); sufiks `.head`, `.cloud`, `.feet`; gabungan `a+b` (titik tengah, mis. `raka+luna`); `crowd`, `town`, `origin`, `rainbow`; id objek di `world.json`.
- Model rambut: `spiky` (jabrik), `bob` (poni rata), `curly` (blok kecil), `bun` (cepol), `mohawk`, `bald`. Aksesori: `none`, `headband` (bando), `bow`. Penampilan tokoh figuran dipilih ber-seed dari `id` (`hashString` + `mulberry32`; tidak ada `Math.random`).
- Palet: pink, krem, lavender, biru muda, hijau zaitun, coklat hangat, persik, butter, sage (lihat `PALETTE`).

## Render: flag `--gl`

`npm run render` memakai `--gl=angle`. Bila WebGL gagal di mesin Anda, coba `--gl=swangle` (perangkat lunak, lebih lambat) atau `--gl=egl`/`--gl=vulkan` di Linux. WebGL berat: bila memori kurang, tambah `--concurrency=1`.

## Pemeriksa kamera (tanpa render)

`npm run check` mencetak, per adegan, proyeksi kepala/kaki/puncak awan tokoh ke frame 9:16 pada 4 titik waktu dan menandai subjek di luar frame. Sampel pada ±0,6–0,9 s pertama adegan 3/4/5 memang dapat menandai "di luar frame" karena sedang dalam transisi.

## Batas clearance kamera
Posisi kamera akhir didorong keluar dari: bangunan/batang pohon (margin 0,9), tokoh (radius 1,25×skala + 0,5, tinggi tubuh), awan (radius 1,9×ukuran), dan dijaga ≥0,95 di atas tanah (`CLEARANCE` di `camera.ts`). Properti kecil (lampu, semak) tidak dihitung. Dorongan dapat terlihat sebagai geseran halus bila tokoh lewat sangat dekat.

## Asumsi (keputusan sendiri)

1. **Awan di atas kepala vs aturan "tanpa awan di atas kepala".** Naskah dan gambar referensi justru bertumpu pada awan di atas kepala setiap orang, sehingga saya menjadikannya *objek cerita* (awan emosi) dan tetap menambah awan langit di latar. Bila Anda ingin mematuhi aturan itu secara harfiah, set `"emotionClouds": false` di `world.json` (awan hilang; hujan dan cahaya tetap).
2. **Jumlah adegan = entri SRT = 9** (naskah punya 7 adegan; adegan 7–9 naskah dipecah mengikuti SRT).
3. Teks SRT hasil TTS memuat salah ketik; subtitle dikoreksi lewat `input/koreksi.json`. Teks narasi audio tidak diubah.
4. Subtitle **HURUF BESAR**, font Poppins Black (`@remotion/google-fonts`, perlu internet saat render pertama; cadangan Arial Black/Impact), SVG text agar sudut stroke membulat.
5. Pagi di adegan 1–4 (preset `morning`), lalu `golden` mulai adegan 5; mendung (`dim`) naik di adegan 3–5 dan kembali cerah di 6–9.
6. Raka mulai terlihat di 12 s (di luar frame adegan 2); Luna di 21,8 s dari gang di x≈16,7. Mira dan Dino menjadi tokoh pendukung adegan 2 dan hujan Mira reda di ±15–17 s.
7. Karakter orisinal bergaya blok dengan kepala rounded box; tidak memakai aset/desain merek mana pun. Wajah: CanvasTexture 4 ekspresi.
8. Cahaya: ambient + 1 directional (PCFSoftShadowMap), `flat` (tanpa tone-mapping) agar pastel tidak pudar; intensitas mengikuti konvensi cahaya fisik three r155+ dan belum diuji visual, sehingga mungkin perlu penyetelan di `ENV_PRESETS`.
9. Kerapatan: kota/pohon/properti/cincin/bukit = geometry gabungan; paving, garis jalan, hujan, awan langit, kerlip = InstancedMesh (hujan ≤ 34×3 instance aktif). Tokoh (14) dibangun dari mesh biasa.
10. Audio: narasi 100%; musik sintetis C–Am–F–G (piano + pluck) ducking ke ≈40% saat narasi; SFX: whoosh tiap transisi, "ting" saat Luna muncul, hujan (volume mengikuti level hujan), langkah, "klik" per pita pelangi, kerlip.
11. Voice/narasi tidak diedit; hanya durasinya yang dibaca.
