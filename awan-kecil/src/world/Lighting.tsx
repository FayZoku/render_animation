import React, { useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";
import { getEnv } from "./env";
import { getCameraPose } from "./camera";

/** Ambient hangat + satu directional rendah (golden hour); frustum bayangan mengikuti area di depan kamera. */
export const Lighting: React.FC = () => {
  const frame = useCurrentFrame();
  const env = getEnv(frame);
  const pose = getCameraPose(frame);
  const target = useMemo(() => new THREE.Object3D(), []);
  // fokus bayangan: titik antara kamera dan titik pandang
  const f: [number, number, number] = [
    pose.pos[0] * 0.3 + pose.lookAt[0] * 0.7,
    0,
    pose.pos[2] * 0.3 + pose.lookAt[2] * 0.7,
  ];
  const d = 90;
  return (
    <>
      <ambientLight color={env.ambColor} intensity={env.ambIntensity} />
      <primitive object={target} position={f} />
      <directionalLight
        color={env.sunColor}
        intensity={env.sunIntensity}
        position={[f[0] + env.sunDir[0] * d, f[1] + env.sunDir[1] * d, f[2] + env.sunDir[2] * d]}
        target={target}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-36}
        shadow-camera-right={36}
        shadow-camera-top={36}
        shadow-camera-bottom={-36}
        shadow-camera-near={10}
        shadow-camera-far={220}
        shadow-bias={-0.0004}
        shadow-normalBias={0.05}
      />
    </>
  );
};
