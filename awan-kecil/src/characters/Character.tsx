import React, { useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";
import { getCharacterDef, getCharacterState, type CharState } from "../world/anchors";
import { mergeBoxes } from "../world/blocks";
import { shadeHex } from "../world/math";
import { hashString } from "../world/prng";
import { accessoryBoxes, hairBoxes } from "./hair";
import { getFaceTexture } from "./face";
import { getBox, getMat } from "./geo";
import { makeLook } from "./look";

const HEAD = { w: 1.5, h: 1.4, d: 1.4 };

interface Pose {
  bob: number;
  hop: number;
  lean: number;
  tiltZ: number;
  headX: number;
  headY: number;
  headZ: number;
  legL: number;
  legR: number;
  armLx: number;
  armLz: number;
  armRx: number;
  armRz: number;
}

function computePose(st: CharState, frame: number): Pose {
  const sway = Math.sin(frame * 0.07 + hashString(st.id) * 0.001);
  const p = st.phase;
  const amp = st.amp;
  const swing = Math.sin(p) * 0.75 * amp;
  const pose: Pose = {
    bob: Math.abs(Math.sin(p)) * 0.09 * amp + Math.sin(frame * 0.09) * 0.015,
    hop: 0,
    lean: 0.06 * amp,
    tiltZ: Math.sin(p) * 0.03 * amp,
    headX: Math.sin(frame * 0.05) * 0.02,
    headY: sway * 0.04,
    headZ: 0,
    legL: swing,
    legR: -swing,
    armLx: -swing * 0.9 + Math.sin(frame * 0.08) * 0.03,
    armLz: -0.05,
    armRx: swing * 0.9 - Math.sin(frame * 0.08) * 0.03,
    armRz: 0.05,
  };
  // postur berdasarkan ekspresi
  if (st.expr === "sad") {
    pose.headX += 0.16;
    pose.lean += 0.06;
    pose.armLx *= 0.7;
    pose.armRx *= 0.7;
  } else if (st.expr === "determined") {
    pose.lean += 0.08;
    pose.headX -= 0.04;
  }
  switch (st.act) {
    case "cover": {
      const raise = Math.min(1, st.repel * 1.6 + 0.4);
      pose.armLx = -2.4 * raise;
      pose.armRx = -2.4 * raise;
      pose.armLz = 0.55 * raise;
      pose.armRz = -0.55 * raise;
      pose.headX += 0.2;
      pose.lean += 0.08;
      break;
    }
    case "laugh": {
      const f = frame * 0.42;
      pose.hop = Math.abs(Math.sin(f)) * 0.42;
      pose.headX = -0.28 + Math.sin(f * 2) * 0.05;
      pose.lean = -0.06;
      pose.armLx = -0.5 + Math.sin(f) * 0.3;
      pose.armRx = -0.5 - Math.sin(f) * 0.3;
      pose.armLz = -0.35;
      pose.armRz = 0.35;
      pose.tiltZ = Math.sin(f) * 0.06;
      break;
    }
    case "hop":
      pose.hop = Math.abs(Math.sin(frame * 0.3)) * 0.45;
      pose.armLz = -0.5;
      pose.armRz = 0.5;
      break;
    case "shock":
      pose.lean = -0.12;
      pose.headX = -0.12;
      pose.armLz = -0.85;
      pose.armRz = 0.85;
      pose.armLx = -0.3;
      pose.armRx = -0.3;
      break;
    default:
      break;
  }
  return pose;
}

export const Character: React.FC<{ id: string }> = ({ id }) => {
  const frame = useCurrentFrame();
  const def = getCharacterDef(id);
  const look = useMemo(() => makeLook(def), [def]);
  const seed = useMemo(() => hashString(id), [id]);

  const hairGeo = useMemo(() => {
    const b = hairBoxes(look.hair, look.hairColor, seed);
    return b.length ? mergeBoxes(b, 0.08) : null;
  }, [look, seed]);
  const accGeo = useMemo(() => {
    const b = accessoryBoxes(look.accessory, look.accessoryColor);
    return b.length ? mergeBoxes(b, 0.05) : null;
  }, [look]);
  const hairMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0 });
    return m;
  }, []);

  const st = getCharacterState(id, frame);
  if (!st.visible) return null;
  const pose = computePose(st, frame);
  const face = getFaceTexture(st.expr);

  const skin = getMat(look.skin);
  const shirt = getMat(look.shirt);
  const pants = getMat(look.pants);
  const shoes = getMat(look.shoes);
  const accent = getMat(shadeHex(look.shirt, 0.35));

  const torsoGeo = getBox(1.7, 1.6, 0.9, 0.16);
  const upperArm = getBox(0.62, 0.64, 0.72, 0.12);
  const lowerArm = getBox(0.6, 0.93, 0.7, 0.12);
  const legGeo = getBox(0.78, 1.2, 0.82, 0.12);
  const shoeGeo = getBox(0.8, 0.32, 0.95, 0.1);
  const headGeo = getBox(HEAD.w, HEAD.h, HEAD.d, 0.42, 4);

  const arm = (side: -1 | 1, rx: number, rz: number) => (
    <group position={[side * 1.19, 3.0, 0]} rotation={[rx, 0, rz]}>
      <mesh geometry={upperArm} material={shirt} position={[0, -0.32, 0]} castShadow receiveShadow dispose={null} />
      <mesh geometry={lowerArm} material={skin} position={[0, -1.1, 0]} castShadow receiveShadow dispose={null} />
    </group>
  );
  const leg = (side: -1 | 1, rx: number) => (
    <group position={[side * 0.41, 1.5, 0]} rotation={[rx, 0, 0]}>
      <mesh geometry={legGeo} material={pants} position={[0, -0.6, 0]} castShadow receiveShadow dispose={null} />
      <mesh geometry={shoeGeo} material={shoes} position={[0, -1.34, 0.06]} castShadow receiveShadow dispose={null} />
    </group>
  );

  return (
    <group position={[st.pos[0], st.pos[1] + pose.hop * st.scale, st.pos[2]]} rotation={[0, st.yaw, 0]} scale={st.scale}>
      <group rotation={[pose.lean, 0, pose.tiltZ]} position={[0, pose.bob, 0]}>
        {leg(-1, pose.legL)}
        {leg(1, pose.legR)}
        <mesh geometry={torsoGeo} material={shirt} position={[0, 2.3, 0]} castShadow receiveShadow dispose={null} />
        {look.pattern === "stripe" && (
          <mesh geometry={getBox(1.74, 0.26, 0.94, 0.05, 1)} material={accent} position={[0, 2.35, 0]} castShadow dispose={null} />
        )}
        {look.pattern === "pocket" && (
          <mesh geometry={getBox(0.5, 0.45, 0.06, 0.04, 1)} material={accent} position={[-0.42, 2.55, 0.47]} dispose={null} />
        )}
        {arm(-1, pose.armLx, pose.armLz)}
        {arm(1, pose.armRx, pose.armRz)}
        <group position={[0, 3.84, 0]} rotation={[pose.headX, pose.headY, pose.headZ + pose.tiltZ]}>
          <mesh geometry={headGeo} material={skin} castShadow receiveShadow dispose={null} />
          <mesh position={[0, -0.05, HEAD.d / 2 + 0.006]} renderOrder={2}>
            <planeGeometry args={[1.0, 0.9]} />
            <meshBasicMaterial map={face} transparent depthWrite={false} toneMapped={false} />
          </mesh>
          {hairGeo && <mesh geometry={hairGeo} material={hairMat} castShadow receiveShadow dispose={null} />}
          {accGeo && <mesh geometry={accGeo} material={hairMat} castShadow dispose={null} />}
        </group>
      </group>
    </group>
  );
};
