/** Separable box blur on a Float32 height/mask field. */
export function boxBlur(
  src: Float32Array,
  w: number,
  h: number,
  radius: number,
  passes = 3,
): Float32Array {
  if (radius < 1) return src.slice();
  const a = src.slice();
  const b = new Float32Array(w * h);
  const r = Math.round(radius);
  const div = r * 2 + 1;

  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < h; y++) {
      const row = y * w;
      let acc = 0;
      for (let x = -r; x <= r; x++) {
        acc += a[row + Math.min(w - 1, Math.max(0, x))];
      }
      for (let x = 0; x < w; x++) {
        b[row + x] = acc / div;
        const add = a[row + Math.min(w - 1, x + r + 1)];
        const sub = a[row + Math.max(0, x - r)];
        acc += add - sub;
      }
    }
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -r; y <= r; y++) {
        acc += b[Math.min(h - 1, Math.max(0, y)) * w + x];
      }
      for (let y = 0; y < h; y++) {
        a[y * w + x] = acc / div;
        const add = b[Math.min(h - 1, y + r + 1) * w + x];
        const sub = b[Math.max(0, y - r) * w + x];
        acc += add - sub;
      }
    }
  }
  return a;
}
