// Procedural canvas textures (client-only).
import * as THREE from "three";

const cache = new Map<string, THREE.Texture>();

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  return { c, ctx };
}

function rand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function finish(key: string, c: HTMLCanvasElement, srgb = true, repeat?: [number, number]) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  cache.set(key, t);
  return t;
}

export function brickTexture(repeat: [number, number]) {
  const key = `brick-${repeat.join("x")}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { c, ctx } = canvas(1024, 1024);
  const r = rand(7);
  ctx.fillStyle = "#2a2522";
  ctx.fillRect(0, 0, 1024, 1024);
  const bw = 128, bh = 48;
  for (let row = 0; row < 1024 / bh + 1; row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let col = -1; col < 1024 / bw + 1; col++) {
      const x = col * bw + off, y = row * bh;
      const l = 22 + r() * 14;
      const hue = 8 + r() * 10;
      ctx.fillStyle = `hsl(${hue} ${30 + r() * 20}% ${l}%)`;
      ctx.fillRect(x + 4, y + 4, bw - 8, bh - 8);
      // speckle
      for (let i = 0; i < 18; i++) {
        ctx.fillStyle = `rgba(0,0,0,${r() * 0.25})`;
        ctx.fillRect(x + 4 + r() * (bw - 10), y + 4 + r() * (bh - 10), 3, 3);
      }
    }
  }
  // grime from the floor up + grease smudges
  const g = ctx.createLinearGradient(0, 1024, 0, 600);
  g.addColorStop(0, "rgba(8,6,5,0.75)");
  g.addColorStop(1, "rgba(8,6,5,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 9; i++) {
    const x = r() * 1024, y = 500 + r() * 500, rad = 40 + r() * 120;
    const sg = ctx.createRadialGradient(x, y, 0, x, y, rad);
    sg.addColorStop(0, "rgba(5,4,3,0.55)");
    sg.addColorStop(1, "rgba(5,4,3,0)");
    ctx.fillStyle = sg;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // drips
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = `rgba(0,0,0,${0.15 + r() * 0.2})`;
    ctx.fillRect(r() * 1024, r() * 300, 2 + r() * 3, 80 + r() * 300);
  }
  return finish(key, c, true, repeat);
}

export function concreteTexture() {
  const key = "concrete";
  const hit = cache.get(key);
  if (hit) return hit;
  const { c, ctx } = canvas(2048, 2048);
  const r = rand(21);
  ctx.fillStyle = "#3a3c42";
  ctx.fillRect(0, 0, 2048, 2048);
  for (let i = 0; i < 9000; i++) {
    const v = 40 + r() * 40;
    ctx.fillStyle = `rgba(${v},${v},${v + 4},${0.08 + r() * 0.1})`;
    ctx.fillRect(r() * 2048, r() * 2048, 2 + r() * 6, 2 + r() * 6);
  }
  // slab joints
  ctx.strokeStyle = "rgba(10,10,12,0.7)";
  ctx.lineWidth = 4;
  for (let i = 1; i < 6; i++) {
    ctx.beginPath(); ctx.moveTo((i * 2048) / 6, 0); ctx.lineTo((i * 2048) / 6, 2048); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, (i * 2048) / 6); ctx.lineTo(2048, (i * 2048) / 6); ctx.stroke();
  }
  // stains + old rubber
  for (let i = 0; i < 40; i++) {
    const x = r() * 2048, y = r() * 2048, rad = 30 + r() * 180;
    const sg = ctx.createRadialGradient(x, y, 0, x, y, rad);
    sg.addColorStop(0, `rgba(8,8,10,${0.25 + r() * 0.35})`);
    sg.addColorStop(1, "rgba(8,8,10,0)");
    ctx.fillStyle = sg;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  ctx.strokeStyle = "rgba(5,5,6,0.35)";
  for (let i = 0; i < 16; i++) {
    ctx.lineWidth = 10 + r() * 10;
    ctx.beginPath();
    const x = r() * 2048, y = r() * 2048;
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + r() * 600 - 300, y + r() * 600 - 300, x + r() * 800 - 400, y + r() * 800 - 400, x + r() * 900 - 450, y + r() * 900 - 450);
    ctx.stroke();
  }
  // cracks
  ctx.strokeStyle = "rgba(0,0,0,0.6)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    let x = r() * 2048, y = r() * 2048;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let k = 0; k < 8; k++) { x += r() * 60 - 30; y += r() * 60 - 30; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  return finish(key, c, true);
}

/** White = rough/dry, dark = wet puddles. */
export function wetRoughness() {
  const key = "wet";
  const hit = cache.get(key);
  if (hit) return hit;
  const { c, ctx } = canvas(1024, 1024);
  const r = rand(5);
  ctx.fillStyle = "#c8c8c8";
  ctx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 26; i++) {
    const x = r() * 1024, y = r() * 1024, rad = 30 + r() * 110;
    const sg = ctx.createRadialGradient(x, y, 0, x, y, rad);
    sg.addColorStop(0, "rgba(20,20,20,1)");
    sg.addColorStop(0.7, "rgba(20,20,20,0.8)");
    sg.addColorStop(1, "rgba(20,20,20,0)");
    ctx.fillStyle = sg;
    ctx.save(); ctx.translate(x, y); ctx.scale(1 + r(), 0.5 + r() * 0.6); ctx.translate(-x, -y);
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    ctx.restore();
  }
  return finish(key, c, false);
}

export function softDot() {
  const key = "dot";
  const hit = cache.get(key);
  if (hit) return hit;
  const { c, ctx } = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return finish(key, c, false);
}

export function blobShadow() {
  const key = "blob";
  const hit = cache.get(key);
  if (hit) return hit;
  const { c, ctx } = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(0,0,0,0.85)");
  g.addColorStop(0.6, "rgba(0,0,0,0.5)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return finish(key, c, false);
}

export function textTexture(
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  srgb = true,
) {
  const hit = cache.get(key);
  if (hit) return hit;
  const { c, ctx } = canvas(w, h);
  draw(ctx, w, h);
  return finish(key, c, srgb);
}

export function neonSign(key: string, lines: string[], color: string, font = "Russo One") {
  return textTexture(key, 1024, 256 * lines.length, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    lines.forEach((line, i) => {
      const y = 128 + i * 256;
      ctx.font = `150px "${font}", "Noto Sans JP", sans-serif`;
      ctx.shadowColor = color;
      ctx.shadowBlur = 30;
      ctx.fillStyle = color;
      ctx.fillText(line, w / 2, y);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = 0.85;
      ctx.font = `140px "${font}", "Noto Sans JP", sans-serif`;
      ctx.fillText(line, w / 2, y);
      ctx.globalAlpha = 1;
    });
  });
}
