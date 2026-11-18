import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { timing } from "../world/data";
import { SUBTITLE } from "./config";
import { FONT_FAMILY } from "./font";
import { buildWords, type WordTiming } from "./words";

const sceneWords: WordTiming[][] = timing.scenes.map((s) =>
  s.words && s.words.length ? s.words.map((w) => ({ w: w.w, start: w.start, end: w.end })) : buildWords(s.text, s.start, s.end),
);

/** Overlay HTML/SVG di atas canvas: satu kata per waktu, putih + stroke hitam, tanpa background. */
export const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const t = frame / fps;
  let word: WordTiming | null = null;
  for (const list of sceneWords) {
    for (const w of list) {
      if (t >= w.start && t < w.end) {
        word = w;
        break;
      }
    }
    if (word) break;
  }
  if (!word) return null;

  const text = SUBTITLE.uppercase ? word.w.toUpperCase() : word.w;
  const maxW = width - SUBTITLE.sideMargin * 2 - SUBTITLE.strokeWidth * 2;
  const est = text.length * SUBTITLE.fontSize * SUBTITLE.avgCharWidth;
  const fontSize = est > maxW ? (SUBTITLE.fontSize * maxW) / est : SUBTITLE.fontSize;

  const local = frame - Math.round(word.start * fps);
  const pop = interpolate(local, [0, SUBTITLE.popFrames], [SUBTITLE.popFrom, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const cx = width / 2;
  const cy = SUBTITLE.boxHeight / 2;

  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: SUBTITLE.bottomMargin, height: SUBTITLE.boxHeight, pointerEvents: "none" }}>
      <svg width={width} height={SUBTITLE.boxHeight} viewBox={`0 0 ${width} ${SUBTITLE.boxHeight}`} style={{ overflow: "visible" }}>
        <g transform={`translate(${cx} ${cy}) scale(${pop}) translate(${-cx} ${-cy})`}>
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={FONT_FAMILY}
            fontWeight={900}
            fontSize={fontSize}
            fill={SUBTITLE.fill}
            stroke={SUBTITLE.stroke}
            strokeWidth={SUBTITLE.strokeWidth * 2}
            strokeLinejoin="round"
            strokeLinecap="round"
            paintOrder="stroke fill"
          >
            {text}
          </text>
        </g>
      </svg>
    </div>
  );
};
