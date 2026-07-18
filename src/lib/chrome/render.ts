import { boxBlur } from "./blur";
import { buildBubbleHeight } from "./height";
import { STAR_5PT } from "./constants";
import { buildMask } from "./mask";
import type { ChromeParams } from "./types";

/** "#rrggbb" → [r, g, b] in 0..1. Falls back to neutral silver. */
function hexToRgb01(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0.76, 0.78, 0.81];
  const n = parseInt(m[1], 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** HSL → RGB in 0..1 (h in degrees). */
function hslToRgb01(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [r + m, g + m, b + m];
}

/** Push channels away from their mean to boost saturation, clamped to 0..1. */
function boostSaturation(
  c: [number, number, number],
  f: number,
): [number, number, number] {
  const mean = (c[0] + c[1] + c[2]) / 3;
  return [
    Math.min(1, Math.max(0, mean + (c[0] - mean) * f)),
    Math.min(1, Math.max(0, mean + (c[1] - mean) * f)),
    Math.min(1, Math.max(0, mean + (c[2] - mean) * f)),
  ];
}

export function renderChrome(
  srcCanvas: HTMLCanvasElement,
  size: number,
  p: ChromeParams,
): HTMLCanvasElement {
  const pad = Math.ceil(size * 0.12);
  const inner = size - pad * 2;
  const sw = srcCanvas.width;
  const sh = srcCanvas.height;
  const scale = Math.min(inner / sw, inner / sh);
  const dw = Math.round(sw * scale);
  const dh = Math.round(sh * scale);
  const ox = Math.round((size - dw) / 2);
  const oy = Math.round((size - dh) / 2);

  const work = document.createElement("canvas");
  work.width = size;
  work.height = size;
  const wctx = work.getContext("2d");
  if (!wctx) throw new Error("Could not create rendering context.");
  wctx.imageSmoothingQuality = "high";
  wctx.drawImage(srcCanvas, ox, oy, dw, dh);
  const imgData = wctx.getImageData(0, 0, size, size);

  const mask = buildMask(imgData, "alpha");
  const w = size;
  const h = size;
  const bevelR = Math.max(1, (p.bevel / 512) * size);
  const height =
    p.profile === "bubble"
      ? buildBubbleHeight(mask, w, h, bevelR)
      : boxBlur(mask, w, h, bevelR / 2, 3);

  const out = wctx.createImageData(w, h);
  const od = out.data;
  const rad = (p.lightAngle * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);

  let lx = cosA * 0.6;
  let ly = sinA * 0.6;
  let lz = 0.75;
  const ll = Math.hypot(lx, ly, lz);
  lx /= ll;
  ly /= ll;
  lz /= ll;

  const depth = p.depth * (size / 512);
  const bands = 6;

  const tintOn = p.tintStrength > 0.001;
  const topC = boostSaturation(hexToRgb01(p.tintSky), 1.35);
  const bottomC = p.tintGradient
    ? boostSaturation(hexToRgb01(p.tintGround), 1.35)
    : topC;
  // Fully saturated tint color; overlay blending keeps highlights white.
  const overallC = hslToRgb01(p.overallHue, 0.92, 0.58);

  for (let y = 0; y < h; y++) {
    // Gradient position within the artwork's vertical extent (0 top, 1 bottom).
    const gy = Math.min(1, Math.max(0, (y - oy) / Math.max(1, dh)));
    const cr = topC[0] * (1 - gy) + bottomC[0] * gy;
    const cg = topC[1] * (1 - gy) + bottomC[1] * gy;
    const cb = topC[2] * (1 - gy) + bottomC[2] * gy;
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const a = mask[i];
      if (a < 0.004) continue;

      const xl = height[i - (x > 0 ? 1 : 0)];
      const xr = height[i + (x < w - 1 ? 1 : 0)];
      const yu = height[i - (y > 0 ? w : 0)];
      const yd = height[i + (y < h - 1 ? w : 0)];

      let nx = -(xr - xl) * depth;
      let ny = -(yd - yu) * depth;
      let nz = 1;
      const nl = Math.hypot(nx, ny, nz);
      nx /= nl;
      ny /= nl;
      nz /= nl;

      const rx = 2 * nz * nx;
      const ry = 2 * nz * ny;
      const rry = rx * sinA + ry * cosA;
      let u = 0.5 - 0.5 * rry;
      u = Math.min(1, Math.max(0, u));

      const c = p.contrast;
      let base: number;
      if (u > 0.5) {
        base = 0.66 - c * 0.1 + (u - 0.5) * 2 * (0.34 + c * 0.1);
      } else {
        base = 0.34 - c * 0.16 + u * 2 * (0.36 + c * 0.06);
      }
      base += p.banding * 0.13 * Math.sin(u * Math.PI * bands + 0.7);
      base = Math.min(1, Math.max(0.04, base));

      const ndl = nx * lx + ny * ly + nz * lz;
      const spec = ndl > 0 ? p.shine * 1.15 * Math.pow(ndl, 42) : 0;

      let r = base;
      let g = base;
      let b = base;

      // Colored shadows: the glow only touches the dark bands of the
      // reflection. The mask ramps in below base ~0.55 and is squared so it
      // concentrates in the deepest shading; mids and highlights stay pure
      // silver. Shadow pixels are re-lit with the saturated glow color
      // (kept luminous enough to read as colored light, not black glaze).
      if (tintOn) {
        // The shadow window widens as strength rises, so high values push
        // color further up into the midtones instead of just saturating
        // the same thin dark band.
        const th = 0.55 + 0.2 * p.tintStrength;
        const t = Math.max(0, (th - base) / th);
        const kw = Math.min(0.98, p.tintStrength * 2.4 * t * t);
        if (kw > 0.001) {
          const glow = 0.32 + base * 1.5;
          r = r * (1 - kw) + cr * glow * kw;
          g = g * (1 - kw) + cg * glow * kw;
          b = b * (1 - kw) + cb * glow * kw;
        }
      }

      // Overall tint: overlay blend of the hue over the metal shading —
      // saturated color in the midtones, whites and blacks preserved.
      if (p.overallTint > 0.001) {
        const k = p.overallTint;
        const tr =
          base < 0.5
            ? 2 * base * overallC[0]
            : 1 - 2 * (1 - base) * (1 - overallC[0]);
        const tg =
          base < 0.5
            ? 2 * base * overallC[1]
            : 1 - 2 * (1 - base) * (1 - overallC[1]);
        const tb =
          base < 0.5
            ? 2 * base * overallC[2]
            : 1 - 2 * (1 - base) * (1 - overallC[2]);
        r = r * (1 - k) + tr * k;
        g = g * (1 - k) + tg * k;
        b = b * (1 - k) + tb * k;
      }
      r += spec;
      g += spec;
      b += spec;

      const j = i * 4;
      od[j] = Math.min(255, r * 255);
      od[j + 1] = Math.min(255, g * 255);
      od[j + 2] = Math.min(255, b * 255);
      od[j + 3] = Math.min(255, a * 255 * 1.05);
    }
  }

  const chrome = document.createElement("canvas");
  chrome.width = w;
  chrome.height = h;
  const chromeCtx = chrome.getContext("2d");
  if (!chromeCtx) throw new Error("Could not create chrome canvas.");
  chromeCtx.putImageData(out, 0, 0);

  const sil = document.createElement("canvas");
  sil.width = w;
  sil.height = h;
  const sctx = sil.getContext("2d");
  if (!sctx) throw new Error("Could not create silhouette canvas.");
  const silData = sctx.createImageData(w, h);
  for (let i = 0; i < mask.length; i++) {
    silData.data[i * 4 + 3] = mask[i] * 255;
  }
  sctx.putImageData(silData, 0, 0);
  sctx.globalCompositeOperation = "source-in";
  sctx.fillStyle = "#05070c";
  sctx.fillRect(0, 0, w, h);

  const final = document.createElement("canvas");
  final.width = w;
  final.height = h;
  const fctx = final.getContext("2d");
  if (!fctx) throw new Error("Could not create output canvas.");

  if (p.shadowOpacity > 0.01) {
    fctx.save();
    fctx.globalAlpha = p.shadowOpacity;
    fctx.filter = `blur(${(p.shadowBlur / 512) * size}px)`;
    fctx.drawImage(sil, 0, (p.shadowDist / 512) * size);
    fctx.restore();
  }
  fctx.drawImage(chrome, 0, 0);
  return final;
}

export function makeStarCanvas(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 480;
  c.height = 480;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Could not create demo canvas.");
  ctx.translate(24, 24);
  ctx.scale(18, 18);
  ctx.fillStyle = "#000";
  ctx.fill(new Path2D(STAR_5PT));
  return c;
}

export function paintPreviewBackground(
  ctx: CanvasRenderingContext2D,
  size: number,
  bg: "dark" | "light" | "checker",
): void {
  if (bg === "dark") {
    ctx.fillStyle = "#101319";
    ctx.fillRect(0, 0, size, size);
    return;
  }
  if (bg === "light") {
    ctx.fillStyle = "#eef0f3";
    ctx.fillRect(0, 0, size, size);
    return;
  }
  const cells = 32;
  const cell = size / cells;
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      ctx.fillStyle = (x + y) % 2 ? "#1a1d24" : "#22262f";
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }
}
