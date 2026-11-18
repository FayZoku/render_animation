import React, { useLayoutEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { getCameraPose } from "./camera";

/** Satu-satunya pengatur kamera: pos, lookAt, fov dari useCurrentFrame. */
export const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const pose = getCameraPose(frame);

  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.set(pose.pos[0], pose.pos[1], pose.pos[2]);
    cam.up.set(0, 1, 0);
    cam.fov = pose.fov;
    cam.aspect = width / height;
    cam.near = 0.3;
    cam.far = 1500;
    cam.lookAt(pose.lookAt[0], pose.lookAt[1], pose.lookAt[2]);
    if (pose.roll) cam.rotateZ(pose.roll);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    invalidate();
  });
  return null;
};
