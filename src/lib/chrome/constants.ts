import type { ChromeParams, PresetName } from "./types";

/** Hue of the classic ice-blue tint — the default for the overall tint. */
export const ICE_HUE = 208;

export const DEFAULTS: ChromeParams = {
  profile: "bevel",
  bevel: 8,
  depth: 6,
  contrast: 0.55,
  banding: 0.35,
  shine: 0.65,
  lightAngle: -35,
  overallTint: 0.18,
  overallHue: ICE_HUE,
  tintStrength: 0,
  tintSky: "#ff4dc4",
  tintGround: "#4d9aff",
  tintGradient: false,
  shadowOpacity: 0.45,
  shadowBlur: 14,
  shadowDist: 10,
};

export const PRESETS: Record<PresetName, ChromeParams> = {
  Sterling: { ...DEFAULTS },
  Mirror: {
    ...DEFAULTS,
    bevel: 14,
    depth: 10,
    contrast: 0.95,
    banding: 0.12,
    shine: 0.9,
    overallTint: 0.08,
  },
  Banded: {
    ...DEFAULTS,
    bevel: 9,
    depth: 8,
    contrast: 0.7,
    banding: 0.85,
    shine: 0.75,
  },
  Bubble: {
    ...DEFAULTS,
    profile: "bubble",
    bevel: 150,
    depth: 5,
    contrast: 0.6,
    banding: 0.1,
    shine: 0.85,
    overallTint: 0.15,
  },
};

export const STAR_5PT =
  "M12 1 L14.65 8.36 L22.46 8.6 L16.28 13.39 L18.47 20.9 L12 16.5 L5.53 20.9 L7.72 13.39 L1.54 8.6 L9.35 8.36 Z";

export const MAX_FILE_BYTES = 8 * 1024 * 1024;
export const ACCEPTED_MIME = new Set([
  "image/png",
  "image/svg+xml",
  "image/jpeg",
  "image/webp",
]);
export const ACCEPTED_EXT = /\.(png|svg|jpe?g|webp)$/i;
