import type { MaskMode } from "./types";

export function buildMask(imgData: ImageData, mode: MaskMode): Float32Array {
  const { data, width: w, height: h } = imgData;
  const m = new Float32Array(w * h);
  for (let i = 0, j = 0; i < m.length; i++, j += 4) {
    const a = data[j + 3] / 255;
    if (mode === "alpha") {
      m[i] = a;
    } else {
      const lum =
        (0.2126 * data[j] + 0.7152 * data[j + 1] + 0.0722 * data[j + 2]) / 255;
      m[i] = mode === "dark" ? (1 - lum) * a : lum * a;
    }
  }
  return m;
}
