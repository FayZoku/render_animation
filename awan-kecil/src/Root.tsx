import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import { FPS, timing } from "./world/data";

const frames = () => Math.ceil(timing.totalSeconds * FPS);

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Video"
    component={Video}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={frames()}
    calculateMetadata={async () => ({ durationInFrames: frames(), fps: FPS, width: 1080, height: 1920 })}
  />
);
