import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { sceneRanges } from "../world/timeline";
import { END_CARD, SUBTITLE } from "./config";
import { FONT_FAMILY } from "./font";

/** Teks akhir "Cukup temani." (adegan terakhir), sepertiga atas layar. */
export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const last = sceneRanges[sceneRanges.length - 1];
  const start = last.startFrame + Math.round(END_CARD.appearAfter * fps);
  if (frame < start) return null;
  const local = frame - start;
  const op = interpolate(local, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  const rise = interpolate(local, [0, 18], [26, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const H = 240;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: END_CARD.centerY - H / 2, height: H, opacity: op, transform: `translateY(${rise}px)`, pointerEvents: "none" }}>
      <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} style={{ overflow: "visible" }}>
        <text
          x={width / 2}
          y={H / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily={FONT_FAMILY}
          fontWeight={900}
          fontSize={END_CARD.fontSize}
          fill={SUBTITLE.fill}
          stroke={SUBTITLE.stroke}
          strokeWidth={END_CARD.strokeWidth * 2}
          strokeLinejoin="round"
          paintOrder="stroke fill"
        >
          {END_CARD.text}
        </text>
      </svg>
    </div>
  );
};
