import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import "./r3f-types";
import { AudioTrack } from "./audio/AudioTrack";
import { EndCard } from "./subtitle/EndCard";
import { Subtitle } from "./subtitle/Subtitle";
import { World } from "./world/World";

export const Video: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#f6dccd" }}>
      <ThreeCanvas
        width={width}
        height={height}
        shadows="soft"
        flat
        camera={{ fov: 40, near: 0.3, far: 1500, position: [0, 5, -10] }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        <World />
      </ThreeCanvas>
      <Subtitle />
      <EndCard />
      <AudioTrack />
    </AbsoluteFill>
  );
};
