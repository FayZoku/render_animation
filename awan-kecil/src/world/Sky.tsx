import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useCurrentFrame } from "remotion";
import { getEnv } from "./env";
import { getCameraPose } from "./camera";
import { clamp, smoothstep } from "./math";

const R = 600;

/** Skydome gradasi pastel (vertex color diperbarui per frame dari getEnv), mengikuti kamera. */
export const Sky: React.FC = () => {
  const frame = useCurrentFrame();
  const invalidate = useThree((s) => s.invalidate);
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(R, 32, 24);
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3));
    return g;
  }, []);
  const env = getEnv(frame);
  const pose = getCameraPose(frame);

  useLayoutEffect(() => {
    const g = geo;
    const pos = g.attributes.position;
    const col = g.attributes.color as THREE.BufferAttribute;
    const top = new THREE.Color(env.skyTop);
    const mid = new THREE.Color(env.skyMid);
    const hor = new THREE.Color(env.skyHor);
    const sun = new THREE.Color(env.sunColor);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) / R;
      const y = pos.getY(i) / R;
      const z = pos.getZ(i) / R;
      const h = clamp(y, 0, 1);
      if (h < 0.28) c.copy(hor).lerp(mid, smoothstep(0, 0.28, h));
      else c.copy(mid).lerp(top, smoothstep(0.28, 0.95, h));
      const d = x * env.sunDir[0] + y * env.sunDir[1] + z * env.sunDir[2];
      if (d > 0) c.lerp(sun, Math.pow(d, 5) * 0.45);
      col.setXYZ(i, c.r, c.g, c.b);
    }
    col.needsUpdate = true;
    invalidate();
  });

  return (
    <mesh geometry={geo} position={pose.pos} frustumCulled={false} renderOrder={-10} dispose={null}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};
