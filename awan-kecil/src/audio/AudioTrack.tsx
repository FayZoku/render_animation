import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { getCharacterState, getRainLevel } from "../world/anchors";
import { FPS, TOTAL_FRAMES, timing, world } from "../world/data";
import { clamp, smoothstep } from "../world/math";
import { sceneRanges } from "../world/timeline";

const MUSIC_BASE = 0.3;
const MUSIC_DUCKED = 0.12;

/** 0..1: narasi sedang berbicara (dengan rampa halus 0.25 s). */
function speaking(frame: number): number {
  const t = frame / FPS;
  let v = 0;
  for (const s of timing.scenes) {
    const a = smoothstep(s.start - 0.3, s.start - 0.05, t);
    const b = 1 - smoothstep(s.end + 0.05, s.end + 0.3, t);
    v = Math.max(v, Math.min(a, b));
  }
  return v;
}

function musicVolume(frame: number): number {
  const fadeIn = clamp(frame / (1.5 * FPS), 0, 1);
  const fadeOut = clamp((TOTAL_FRAMES - frame) / (2.5 * FPS), 0, 1);
  const base = MUSIC_BASE + (MUSIC_DUCKED - MUSIC_BASE) * speaking(frame);
  return base * fadeIn * fadeOut;
}

const RAIN_LEN = 180; // frame (6 s)
const STEP_LEN = 36; // frame (1.2 s)

function tiles(from: number, to: number, len: number): number[] {
  const out: number[] = [];
  for (let f = from; f < to; f += len) out.push(f);
  return out;
}

const partner = world.characters.find((c) => c.role === "partner");
const heroId = world.characters.find((c) => c.role === "hero")?.id ?? "raka";

export const AudioTrack: React.FC = () => {
  const rainStart = Math.floor(9 * FPS);
  const rainEnd = Math.floor(41 * FPS);
  const stepStart = Math.floor(12 * FPS);
  const bandFrames = Array.from({ length: 6 }, (_, i) => Math.round(world.rainbow.appearAt * FPS) + i * 4);
  return (
    <>
      <Audio src={staticFile("narasi.mp3")} volume={1} />
      <Audio src={staticFile("musik.wav")} volume={musicVolume} />

      {/* whoosh pada transisi kamera */}
      {sceneRanges.slice(1).map((r) => (
        <Sequence key={`w${r.id}`} from={Math.max(0, r.startFrame - 8)} durationInFrames={24}>
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.35} />
        </Sequence>
      ))}

      {/* "ting" saat awan Luna muncul */}
      {partner && partner.visibleFrom !== undefined && (
        <Sequence from={Math.round(partner.visibleFrom * FPS)} durationInFrames={60}>
          <Audio src={staticFile("sfx/ting.wav")} volume={0.45} />
        </Sequence>
      )}

      {/* hujan: ubin berurutan agar volume mengikuti level hujan (gerimis -> reda) */}
      {tiles(rainStart, rainEnd, RAIN_LEN).map((f) => (
        <Sequence key={`r${f}`} from={f} durationInFrames={RAIN_LEN}>
          <Audio src={staticFile("sfx/rain.wav")} volume={(local: number) => 0.5 * Math.pow(getRainLevel(f + local), 1.2)} />
        </Sequence>
      ))}

      {/* langkah pelan mengikuti kecepatan tokoh utama */}
      {tiles(stepStart, TOTAL_FRAMES - 20, STEP_LEN).map((f) => (
        <Sequence key={`s${f}`} from={f} durationInFrames={STEP_LEN}>
          <Audio
            src={staticFile("sfx/steps.wav")}
            volume={(local: number) => {
              const s = getCharacterState(heroId, f + local);
              return s.visible ? 0.16 * smoothstep(0.4, 1.4, s.speed) : 0;
            }}
          />
        </Sequence>
      ))}

      {/* pelangi: kerlip + "klik" tiap pita */}
      <Sequence from={Math.max(0, Math.round((world.rainbow.appearAt - 0.9) * FPS))} durationInFrames={45}>
        <Audio src={staticFile("sfx/sparkle.wav")} volume={0.4} />
      </Sequence>
      {bandFrames.map((f, i) => (
        <Sequence key={`b${i}`} from={f} durationInFrames={10}>
          <Audio src={staticFile("sfx/pop.wav")} volume={0.3} />
        </Sequence>
      ))}
    </>
  );
};
