import React, { useMemo } from "react";
import * as THREE from "three";
import { mergeBoxes } from "./blocks";
import { buildTown } from "./townData";
import { MATERIAL } from "./palette";

/** Semua bangunan, pohon, properti, cincin kota jauh, dan bukit: geometry gabungan statis (dibuat sekali). */
const TownInner: React.FC = () => {
  const { buildings, trees, props, ring, hills } = useMemo(() => {
    const t = buildTown();
    return {
      buildings: mergeBoxes(t.buildings, 0.12),
      trees: mergeBoxes(t.trees, 0.2),
      props: mergeBoxes(t.props, 0.06),
      ring: mergeBoxes(t.ring, 0.12),
      hills: mergeBoxes(t.hills, 4),
    };
  }, []);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: MATERIAL.roughness, metalness: MATERIAL.metalness }),
    [],
  );
  return (
    <group>
      <mesh geometry={buildings} material={mat} castShadow receiveShadow dispose={null} />
      <mesh geometry={trees} material={mat} castShadow receiveShadow dispose={null} />
      <mesh geometry={props} material={mat} castShadow receiveShadow dispose={null} />
      <mesh geometry={ring} material={mat} receiveShadow dispose={null} />
      <mesh geometry={hills} material={mat} dispose={null} />
    </group>
  );
};
export const Town = React.memo(TownInner);
