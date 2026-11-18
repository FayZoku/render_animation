import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { getRainbow } from "./anchors";
import { getCameraPose } from "./camera";
import { mergeBoxes } from "./blocks";
import { world } from "./data";
import type { BoxSpec } from "./townData";

const BAND_COLORS = ["#f7a9bb", "#fbc7a0", "#fbe5a0", "#b8e2ae", "#a8d3f0", "#c8b8ee"];
const STEPS = 22;

/** Pelangi voxel (6 pita kotak). Menghadap kamera pada sumbu Y, pop-in bertahap per pita. */
export const Rainbow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rb = getRainbow(frame);
  const bands = useMemo(() => {
    const R = world.rainbow.radius;
    return BAND_COLORS.map((c, i) => {
      const r = R - i * 0.42;
      const boxes: BoxSpec[] = [];
      for (let k = 0; k <= STEPS; k++) {
        const a = (k / STEPS) * Math.PI;
        boxes.push({ p: [Math.cos(a) * r, Math.sin(a) * r, 0], s: [0.62, 0.46, 0.5], c, r: 0.1, rz: a });
      }
      return mergeBoxes(boxes, 0.1);
    });
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0, emissive: "#ffffff", emissiveIntensity: 0.18 }), []);
  if (!rb.visible) return null;
  const cam = getCameraPose(frame).pos;
  const dx = cam[0] - rb.center[0];
  const dz = cam[2] - rb.center[2];
  const len = Math.hypot(dx, dz) || 1;
  // geser 2.5 unit menjauhi kamera (di belakang tokoh & awan)
  const pos: [number, number, number] = [rb.center[0] - (dx / len) * 2.5, rb.center[1], rb.center[2] - (dz / len) * 2.5];
  const yaw = Math.atan2(dx, dz);
  return (
    <group position={pos} rotation={[0, yaw, 0]}>
      {bands.map((g, i) => {
        const s = spring({ frame: frame - Math.round(world.rainbow.appearAt * fps) - i * 4, fps, config: { damping: 12, stiffness: 120 } });
        return <mesh key={i} geometry={g} material={mat} scale={[Math.max(0.001, s), Math.max(0.001, s), Math.max(0.001, s)]} castShadow dispose={null} />;
      })}
    </group>
  );
};

const SPARK_N = 18;
const sparkDummy = new THREE.Object3D();

/** Kerlip kecil saat dua awan menyatu. */
export const Sparkles: React.FC = () => {
  const frame = useCurrentFrame();
  const invalidate = useThree((s) => s.invalidate);
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.BoxGeometry(0.22, 0.22, 0.22), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff3b8", emissive: "#ffe08a", emissiveIntensity: 0.9, roughness: 0.5 }), []);
  const rb = getRainbow(frame);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const t = frame / 30;
    const t0 = world.rainbow.appearAt - 1.2;
    const life = Math.max(0, Math.min(1, (t - t0) / 0.6)) * (1 - Math.max(0, Math.min(1, (t - (t0 + 5)) / 1.5)));
    for (let i = 0; i < SPARK_N; i++) {
      const a = (i / SPARK_N) * Math.PI * 2 + frame * 0.01;
      const r = 2.2 + (i % 3) * 0.7;
      const tw = Math.max(0, Math.sin(frame * 0.2 + i * 1.7)) * life;
      sparkDummy.position.set(rb.center[0] + Math.cos(a) * r, rb.center[1] + 2.4 + Math.sin(a * 2 + i) * 0.9, rb.center[2] + Math.sin(a) * r * 0.6);
      sparkDummy.scale.set(tw, tw, tw);
      sparkDummy.rotation.set(frame * 0.05 + i, frame * 0.04, 0);
      sparkDummy.updateMatrix();
      m.setMatrixAt(i, sparkDummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    invalidate();
  });
  return <instancedMesh ref={ref} args={[geo, mat, SPARK_N]} frustumCulled={false} />;
};
