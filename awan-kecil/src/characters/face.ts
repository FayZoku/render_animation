// Wajah minimalis lewat CanvasTexture kecil (4 ekspresi), dibuat sekali per ekspresi.
import * as THREE from "three";
import type { Expression } from "../world/types";

const W = 256;
const H = 230;
const cache = new Map<Expression, THREE.CanvasTexture>();
const INK = "#3a2a2e";

// bidang wajah: x -0.5..0.5, y -0.45..0.45 (satuan plane 1.0 x 0.9)
const px = (x: number) => (x + 0.5) * W;
const py = (y: number) => ((0.45 - y) / 0.9) * H;

function draw(e: Expression): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d") as CanvasRenderingContext2D;
  g.clearRect(0, 0, W, H);
  g.fillStyle = INK;
  g.strokeStyle = INK;
  g.lineCap = "round";
  g.lineJoin = "round";
  const dot = (x: number, y: number, r: number) => {
    g.beginPath();
    g.arc(px(x), py(y), r * W, 0, Math.PI * 2);
    g.fill();
  };
  const line = (x1: number, y1: number, x2: number, y2: number, w: number) => {
    g.lineWidth = w * W;
    g.beginPath();
    g.moveTo(px(x1), py(y1));
    g.lineTo(px(x2), py(y2));
    g.stroke();
  };
  const curve = (x1: number, y1: number, cx: number, cy: number, x2: number, y2: number, w: number) => {
    g.lineWidth = w * W;
    g.beginPath();
    g.moveTo(px(x1), py(y1));
    g.quadraticCurveTo(px(cx), py(cy), px(x2), py(y2));
    g.stroke();
  };
  const EY = 0.06;
  switch (e) {
    case "happy":
      dot(-0.25, EY, 0.05);
      dot(0.25, EY, 0.05);
      curve(-0.14, -0.14, 0, -0.27, 0.14, -0.14, 0.028);
      break;
    case "sad":
      dot(-0.25, EY - 0.01, 0.05);
      dot(0.25, EY - 0.01, 0.05);
      line(-0.36, 0.16, -0.15, 0.2, 0.024);
      line(0.36, 0.16, 0.15, 0.2, 0.024);
      curve(-0.13, -0.24, 0, -0.14, 0.13, -0.24, 0.028);
      break;
    case "shock":
      dot(-0.25, EY + 0.01, 0.07);
      dot(0.25, EY + 0.01, 0.07);
      g.fillStyle = "#ffffff";
      dot(-0.23, EY + 0.03, 0.02);
      dot(0.27, EY + 0.03, 0.02);
      g.fillStyle = INK;
      line(-0.36, 0.24, -0.15, 0.24, 0.022);
      line(0.36, 0.24, 0.15, 0.24, 0.022);
      g.beginPath();
      g.ellipse(px(0), py(-0.22), 0.05 * W, 0.065 * H, 0, 0, Math.PI * 2);
      g.fill();
      break;
    case "determined":
      dot(-0.25, EY - 0.02, 0.045);
      dot(0.25, EY - 0.02, 0.045);
      line(-0.37, 0.2, -0.14, 0.13, 0.028);
      line(0.37, 0.2, 0.14, 0.13, 0.028);
      curve(-0.12, -0.2, 0.02, -0.23, 0.13, -0.17, 0.026);
      break;
  }
  return cv;
}

export function getFaceTexture(e: Expression): THREE.CanvasTexture {
  const hit = cache.get(e);
  if (hit) return hit;
  const tex = new THREE.CanvasTexture(draw(e));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  cache.set(e, tex);
  return tex;
}
