import { boxBlur } from "./blur";

/** Two-pass chamfer distance for bubble height fields. */
function chamferDistance(mask: Float32Array, w: number, h: number): Float32Array {
  const dist = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) dist[i] = mask[i] > 0.5 ? 1e9 : 0;
  const D1 = 1;
  const D2 = Math.SQRT2;

  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      const i = row + x;
      if (dist[i] === 0) continue;
      let m = dist[i];
      if (x > 0) m = Math.min(m, dist[i - 1] + D1);
      if (y > 0) {
        m = Math.min(m, dist[i - w] + D1);
        if (x > 0) m = Math.min(m, dist[i - w - 1] + D2);
        if (x < w - 1) m = Math.min(m, dist[i - w + 1] + D2);
      }
      dist[i] = m;
    }
  }

  for (let y = h - 1; y >= 0; y--) {
    const row = y * w;
    for (let x = w - 1; x >= 0; x--) {
      const i = row + x;
      if (dist[i] === 0) continue;
      let m = dist[i];
      if (x < w - 1) m = Math.min(m, dist[i + 1] + D1);
      if (y < h - 1) {
        m = Math.min(m, dist[i + w] + D1);
        if (x < w - 1) m = Math.min(m, dist[i + w + 1] + D2);
        if (x > 0) m = Math.min(m, dist[i + w - 1] + D2);
      }
      dist[i] = m;
    }
  }
  return dist;
}

/** Hemisphere height field that domes across the full shape width. */
export function buildBubbleHeight(
  mask: Float32Array,
  w: number,
  h: number,
  R: number,
): Float32Array {
  const dist = chamferDistance(mask, w, h);
  const raw = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (mask[i] <= 0.004) continue;
    const dc = Math.min(dist[i], R);
    raw[i] = R > 0 ? Math.sqrt(Math.max(0, 2 * R * dc - dc * dc)) / R : 0;
  }
  return boxBlur(raw, w, h, Math.max(1, R * 0.04), 2);
}
