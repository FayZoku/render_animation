import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { PALETTE } from "./palette";
import { makeRng } from "./prng";

const LONG = 1600;

function PavingInstances() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((s) => s.invalidate);
  const geo = useMemo(() => new RoundedBoxGeometry(0.76, 0.08, 0.32, 1, 0.025), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0 }), []);
  const items = useMemo(() => {
    const rng = makeRng(404);
    const list: { x: number; z: number; c: THREE.Color }[] = [];
    const base = [new THREE.Color("#dcc7c6"), new THREE.Color("#d3c1cb"), new THREE.Color("#e0cdbf"), new THREE.Color("#cdbfce")];
    for (const side of [1, -1]) {
      const rows = 15;
      for (let r = 0; r < rows; r++) {
        const z = side * (3.55 + r * 0.36);
        const off = r % 2 === 0 ? 0 : 0.4;
        for (let x = -64; x < 64; x += 0.8) {
          const c = base[Math.floor(rng() * base.length)].clone();
          c.offsetHSL(0, 0, (rng() - 0.5) * 0.05);
          list.push({ x: x + off, z, c });
        }
      }
    }
    return list;
  }, []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const d = new THREE.Object3D();
    items.forEach((it, i) => {
      d.position.set(it.x, 0.27, it.z);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
      m.setColorAt(i, it.c);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    invalidate();
  }, [items, invalidate]);
  return (
    <instancedMesh ref={ref} args={[geo, mat, items.length]} receiveShadow castShadow frustumCulled={false} />
  );
}

function LaneDashes() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((s) => s.invalidate);
  const geo = useMemo(() => new RoundedBoxGeometry(2.2, 0.03, 0.2, 1, 0.01), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: PALETTE.cream, roughness: 0.8 }), []);
  const N = 80;
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const d = new THREE.Object3D();
    for (let i = 0; i < N; i++) {
      d.position.set(-160 + i * 4, 0.012, 0);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    invalidate();
  }, [invalidate]);
  return <instancedMesh ref={ref} args={[geo, mat, N]} receiveShadow frustumCulled={false} />;
}

const GroundInner: React.FC = () => (
  <group>
    {/* tanah luas sampai cakrawala (ditutup fog) */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
      <circleGeometry args={[850, 64]} />
      <meshStandardMaterial color={PALETTE.ground} roughness={0.9} metalness={0} />
    </mesh>
    {/* jalan */}
    <mesh position={[0, -0.09, 0]} receiveShadow>
      <boxGeometry args={[LONG, 0.18, 6]} />
      <meshStandardMaterial color={PALETTE.road} roughness={0.85} metalness={0} />
    </mesh>
    <LaneDashes />
    {/* trotoar + kerb, dua sisi */}
    {[1, -1].map((s) => (
      <group key={s}>
        <mesh position={[0, 0.125, s * 6]} receiveShadow>
          <boxGeometry args={[LONG, 0.25, 6]} />
          <meshStandardMaterial color={PALETTE.sidewalk} roughness={0.85} metalness={0} />
        </mesh>
        <mesh position={[0, 0.15, s * 3.2]} receiveShadow castShadow>
          <boxGeometry args={[LONG, 0.3, 0.4]} />
          <meshStandardMaterial color={PALETTE.curb} roughness={0.8} metalness={0} />
        </mesh>
      </group>
    ))}
    {/* gang tempat Luna muncul */}
    <mesh position={[16.75, 0.02, 24.5]} receiveShadow>
      <boxGeometry args={[5.5, 0.06, 31]} />
      <meshStandardMaterial color="#bdb2c8" roughness={0.85} metalness={0} />
    </mesh>
    <PavingInstances />
  </group>
);
export const Ground = React.memo(GroundInner);
