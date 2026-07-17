export type ChromeProfile = "bevel" | "bubble";
export type MaskMode = "alpha" | "dark" | "light";
export type PreviewBg = "dark" | "light" | "checker";

export interface ChromeParams {
  profile: ChromeProfile;
  bevel: number;
  depth: number;
  contrast: number;
  banding: number;
  shine: number;
  lightAngle: number;
  blueTint: number;
  shadowOpacity: number;
  shadowBlur: number;
  shadowDist: number;
}

export type PresetName = "Sterling" | "Mirror" | "Satin" | "Banded" | "Bubble";
