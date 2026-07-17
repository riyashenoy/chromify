import { boxBlur } from "./blur";
import { buildBubbleHeight } from "./height";
import { ICE, STAR_5PT } from "./constants";
import { buildMask } from "./mask";
import type { ChromeParams, MaskMode } from "./types";

export function renderChrome(
  srcCanvas: HTMLCanvasElement,
  size: number,
  p: ChromeParams,
  maskMode: MaskMode,
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

  const mask = buildMask(imgData, maskMode);
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

  for (let y = 0; y < h; y++) {
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

      const k = p.blueTint * (1 - base);
      let r = base * (1 - k) + ICE[0] * base * k;
      let g = base * (1 - k) + ICE[1] * base * k;
      let b = base * (1 - k * 0.4) + ICE[2] * base * k;
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
