// Side-panel liveries drawn on canvas. Canvas maps the car side: x = length (rear left -> front right),
// y = height (top of canvas = roof height 1.4m).
import { textTexture } from "./textures";
import * as THREE from "three";

export const SIDE_LEN = 4.8;
export const SIDE_H = 1.4;

function sideTex(key: string, base: string, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const t = textTexture(key, 2048, 600, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    draw(ctx, w, h);
  });
  t.repeat.set(1 / SIDE_LEN, 1 / SIDE_H);
  t.offset.set(0.5, 0);
  return t;
}

/** x in metres (-2.4..2.4), y in metres (0..1.4) -> canvas px */
const px = (w: number, x: number) => ((x + SIDE_LEN / 2) / SIDE_LEN) * w;
const py = (h: number, y: number) => (1 - y / SIDE_H) * h;

export function r34Side() {
  return sideTex("liv-r34", "#c3c7cc", (ctx, w, h) => {
    // two blue stripes sweeping along the lower body
    ctx.fillStyle = "#1557ff";
    ctx.beginPath();
    ctx.moveTo(px(w, 2.4), py(h, 0.62));
    ctx.lineTo(px(w, 0.6), py(h, 0.58));
    ctx.lineTo(px(w, -0.8), py(h, 0.4));
    ctx.lineTo(px(w, -2.4), py(h, 0.36));
    ctx.lineTo(px(w, -2.4), py(h, 0.26));
    ctx.lineTo(px(w, -0.8), py(h, 0.3));
    ctx.lineTo(px(w, 0.6), py(h, 0.48));
    ctx.lineTo(px(w, 2.4), py(h, 0.52));
    ctx.fill();
    ctx.fillStyle = "#0a2fa8";
    ctx.fillRect(px(w, -2.4), py(h, 0.24), w, 6);
    // sponsor-style blocks (generic)
    ctx.fillStyle = "#0d1a4a";
    ctx.fillRect(px(w, -0.4), py(h, 0.82), 220, 34);
    ctx.fillStyle = "#e9eef5";
    ctx.font = "bold 28px 'Russo One', sans-serif";
    ctx.fillText("RB26 // KR", px(w, -0.36), py(h, 0.82) + 27);
    ctx.fillStyle = "#1557ff";
    ctx.font = "bold 34px 'Russo One', sans-serif";
    ctx.fillText("SP UNDERGROUND", px(w, 0.9), py(h, 0.7));
  });
}

export function supraSide() {
  return sideTex("liv-supra", "#ff7410", (ctx, w, h) => {
    // tribal / graphic shapes on the rear quarter
    ctx.fillStyle = "#2b2f33";
    ctx.beginPath();
    ctx.moveTo(px(w, 0.3), py(h, 0.78));
    ctx.quadraticCurveTo(px(w, -0.6), py(h, 0.95), px(w, -1.6), py(h, 0.8));
    ctx.lineTo(px(w, -1.0), py(h, 0.7));
    ctx.quadraticCurveTo(px(w, -0.4), py(h, 0.55), px(w, -1.4), py(h, 0.4));
    ctx.quadraticCurveTo(px(w, -0.2), py(h, 0.52), px(w, 0.3), py(h, 0.78));
    ctx.fill();
    ctx.strokeStyle = "#8be14a";
    ctx.lineWidth = 8;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(px(w, 1.8 - i * 0.12), py(h, 0.5 + i * 0.05));
      ctx.lineTo(px(w, 0.8 - i * 0.1), py(h, 0.52 + i * 0.05));
      ctx.stroke();
    }
    ctx.fillStyle = "#1a1a1a";
    ctx.font = "bold 40px 'Russo One', sans-serif";
    ctx.fillText("2JZ", px(w, 1.2), py(h, 0.36));
  });
}

export function eclipseSide() {
  return sideTex("liv-eclipse", "#86f20f", (ctx, w, h) => {
    // blue vinyl flames from the front arch backwards
    ctx.fillStyle = "#1638d6";
    ctx.beginPath();
    ctx.moveTo(px(w, 1.7), py(h, 0.62));
    const spikes = 7;
    for (let i = 0; i <= spikes; i++) {
      const x = 1.6 - i * 0.42;
      ctx.lineTo(px(w, x + 0.1), py(h, 0.86 - (i % 2) * 0.1));
      ctx.lineTo(px(w, x - 0.25), py(h, 0.7));
    }
    ctx.lineTo(px(w, -1.6), py(h, 0.36));
    for (let i = spikes; i >= 0; i--) {
      const x = 1.6 - i * 0.42;
      ctx.lineTo(px(w, x - 0.2), py(h, 0.3 + (i % 2) * 0.08));
      ctx.lineTo(px(w, x + 0.1), py(h, 0.46));
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#e9f7ff";
    ctx.lineWidth = 5;
    ctx.stroke();
  });
}

/** Lengthwise stripes on hood/roof/trunk (texture depends on the width axis only). */
export function topStripes(key: string, base: string, stripe: string | null, depth: number, bevel: number) {
  const t = textTexture(key, 64, 512, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    if (stripe) {
      ctx.fillStyle = stripe;
      ctx.fillRect(0, h * 0.36, w, h * 0.1);
      ctx.fillRect(0, h * 0.54, w, h * 0.1);
    }
  });
  // ExtrudeGeometry side UV v = 1 - z, z in [-bevel, depth + bevel] -> remap to [0,1]
  const D = depth + bevel * 2;
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(1, -1 / D);
  t.offset.set(0, (1 + bevel) / D);
  return t;
}

export function plateTexture(text: string) {
  return textTexture(`plate-${text}`, 256, 96, (ctx, w, h) => {
    ctx.fillStyle = "#f1f3f5";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#1d4fd6";
    ctx.fillRect(0, 0, w, 20);
    ctx.fillStyle = "#111";
    ctx.font = "bold 54px 'Russo One', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(text, w / 2, 78);
  });
}
