import React from "react";
import { useCurrentFrame } from "remotion";
import { Stage } from "../scenes/Stage";
import { CameraRig } from "./CameraRig";
import { Ground } from "./Ground";
import { Lighting } from "./Lighting";
import { Sky } from "./Sky";
import { SkyClouds } from "./Clouds";
import { Town } from "./Town";
import { getEnv } from "./env";

export const World: React.FC = () => {
  const frame = useCurrentFrame();
  const env = getEnv(frame);
  return (
    <>
      <CameraRig />
      <fog attach="fog" args={[env.fog, env.fogNear, env.fogFar]} />
      <Sky />
      <Lighting />
      <Ground />
      <Town />
      <SkyClouds />
      <Stage />
    </>
  );
};
