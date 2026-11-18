import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useCurrentFrame } from "remotion";
import { getCharacterDef, getCharacterState, groundY } from "./anchors";
import { PALETTE } from "./palette";
import { lerpHex } from "./math";
import { makeRng, rngRange } from "./prng";
import { world } from "./data";

// ---------------------------------------------------------------- geometry awan (gumpalan bulat low-poly)
const BLOBS: [number, number, number, number][] = [
  [0, 0, 0, 1.0],
  [-0.95, -0.15, 0, 0.72],
  [1.0, -0.1, 0.05, 0.76],
  [-0.4, 0.5, 0.1, 0.7],
  [0.45, 0.45, -0.1, 0.66],
  [0, -0.25, 0.6, 0.6],
  [0.05, -0.2, -0.55, 0.62],
];
let cloudGeoCache: THREE.BufferGeometry | null = null;
export function getCloudGeometry(): THREE.BufferGeometry {
  if (cloudGeoCache) return cloudGeoCache;
  const parts = BLOBS.map(([x, y, z, r]) => {
    const g = new THREE.SphereGeometry(r, 9, 7);
    g.translate(x, y, z);
    return g;
  });
  const m = mergeGeometries(parts, false) as THREE.BufferGeometry;
  m.scale(1, 0.78, 1);
  parts.forEach((p) => p.dispose());
  cloudGeoCache = m;
  return m;
}

// ---------------------------------------------------------------- awan emosi di atas kepala
export const EmotionCloud: React.FC<{ id: string }> = ({ id }) => {
  const frame = useCurrentFrame();
  const st = getCharacterState(id, frame);
  const geo = useMemo(() => getCloudGeometry(), []);
  if (!st.visible) return null;
  const c = st.cloud;
  const body = lerpHex(PALETTE.cloudStorm, PALETTE.cloudWhite, Math.pow(c.mood, 0.8));
  const color = c.glow > 0.01 ? lerpHex(body, c.tint, 0.55 * c.glow) : body;
  const emissive = c.glow > 0.01 ? lerpHex("#fff4e6", c.tint, 0.6) : "#fff4e8";
  const emI = 0.14 * c.mood + 0.5 * c.glow * c.mood;
  const phase = frame * 0.05 + id.length;
  const bob = Math.sin(phase) * 0.09;
  const s = c.size * (1 + Math.sin(phase * 0.7) * 0.025);
  return (
    <mesh
      geometry={geo}
      position={[c.pos[0], c.pos[1] + bob, c.pos[2]]}
      rotation={[0, Math.sin(frame * 0.012 + id.length) * 0.25, 0]}
      scale={[s * 1.15, s, s * 1.0]}
      castShadow={c.mood < 0.5}
      dispose={null}
    >
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emI} roughness={0.95} metalness={0} flatShading />
    </mesh>
  );
};

// ---------------------------------------------------------------- hujan (partikel kotak kecil, InstancedMesh)
const RAIN_N = 34;
const rainDummy = new THREE.Object3D();

export const Rain: React.FC<{ id: string }> = ({ id }) => {
  const frame = useCurrentFrame();
  const invalidate = useThree((s) => s.invalidate);
  const ref = useRef<THREE.InstancedMesh>(null);
  const puddleRef = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => new THREE.BoxGeometry(0.06, 0.55, 0.06), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: PALETTE.rain, emissive: "#8fa6d8", emissiveIntensity: 0.25, roughness: 0.5, metalness: 0 }), []);
  const seeds = useMemo(() => {
    const rng = makeRng(id + "-rain");
    return Array.from({ length: RAIN_N }, () => ({ u: rng(), a: rng() * Math.PI * 2, r: Math.sqrt(rng()), sp: rngRange(rng, 0.8, 1.2) }));
  }, [id]);
  const st = getCharacterState(id, frame);
  const rain = st.visible ? st.cloud.rain : 0;

  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const c = st.cloud;
    const gy = groundY(st.pos[0], st.pos[2]);
    const top = c.pos[1] - 0.55 * c.size;
    const H = Math.max(0.5, top - gy);
    const active = Math.round(RAIN_N * Math.min(1, rain));
    const spread = 1.55 * c.size + 0.4;
    for (let i = 0; i < RAIN_N; i++) {
      if (i >= active) {
        rainDummy.scale.set(0, 0, 0);
        rainDummy.position.set(0, -10, 0);
      } else {
        const sd = seeds[i];
        const ph = (frame * 0.05 * sd.sp * (0.5 + rain) + sd.u) % 1;
        rainDummy.position.set(c.pos[0] + Math.cos(sd.a) * sd.r * spread, top - ph * H, c.pos[2] + Math.sin(sd.a) * sd.r * spread * 0.8);
        rainDummy.scale.set(1, 0.6 + 0.6 * rain, 1);
      }
      rainDummy.updateMatrix();
      m.setMatrixAt(i, rainDummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    const p = puddleRef.current;
    if (p) {
      const w = Math.min(1, rain * 1.2);
      p.position.set(st.pos[0], gy + 0.02, st.pos[2]);
      p.scale.set(Math.max(0.001, w * 2.6), 1, Math.max(0.001, w * 2.2));
    }
    invalidate();
  });

  return (
    <group>
      <instancedMesh ref={ref} args={[geo, mat, RAIN_N]} frustumCulled={false} />
      <mesh ref={puddleRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1, 20]} />
        <meshStandardMaterial color="#9fb3d8" roughness={0.25} metalness={0} transparent opacity={0.55} />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------- awan langit (latar), InstancedMesh
export const SkyClouds: React.FC = () => {
  const frame = useCurrentFrame();
  const invalidate = useThree((s) => s.invalidate);
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => getCloudGeometry(), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#fff2e6", emissiveIntensity: 0.35, roughness: 1, metalness: 0, flatShading: true }), []);
  const N = world.ring.skyClouds.count;
  const items = useMemo(() => {
    const rng = makeRng(world.ring.skyClouds.seed);
    return Array.from({ length: N }, () => ({
      x: rngRange(rng, -300, 300),
      z: rngRange(rng, -300, 300),
      y: rngRange(rng, 38, 85),
      s: rngRange(rng, 7, 16),
      v: rngRange(rng, 0.012, 0.03),
      d: rng() * Math.PI * 2,
    }));
  }, [N]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const d = new THREE.Object3D();
    items.forEach((it, i) => {
      const x = ((((it.x + frame * it.v + 300) % 600) + 600) % 600) - 300;
      d.position.set(x, it.y + Math.sin(frame * 0.01 + it.d) * 0.6, it.z);
      d.scale.set(it.s * 1.5, it.s * 0.8, it.s);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    invalidate();
  });
  return <instancedMesh ref={ref} args={[geo, mat, N]} frustumCulled={false} />;
};

export const hasRain = (id: string): boolean => {
  const d = getCharacterDef(id);
  return !!d.cloud && d.cloud.some((k) => k.rain > 0);
};
