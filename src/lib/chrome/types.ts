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
  /** Overall tint strength across the whole metal (0 = none) */
  overallTint: number;
  /** Hue (degrees) of the overall tint */
  overallHue: number;
  /** 0 = pure silver shadows; higher pushes color into the dark bands */
  tintStrength: number;
  /** Shadow glow color (top of gradient when tintGradient is on) */
  tintSky: string;
  /** Bottom gradient color, used when tintGradient is on */
  tintGround: string;
  /** When true, shadow glow blends tintSky→tintGround top to bottom */
  tintGradient: boolean;
  shadowOpacity: number;
  shadowBlur: number;
  shadowDist: number;
}

export type PresetName = "Sterling" | "Mirror" | "Banded" | "Bubble";
