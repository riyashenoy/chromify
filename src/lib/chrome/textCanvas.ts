export interface TextFontOption {
  id: string;
  label: string;
  /** CSS font-family stack for canvas fillText */
  family: string;
  /** Optional next/font CSS variable already on <html> */
  cssVar?: string;
  weight?: string;
}

/**
 * Cool display faces via next/font — geometric, condensed, one script.
 */
export const TEXT_FONTS: TextFontOption[] = [
  {
    id: "syne",
    label: "Syne",
    family: "Arial Black, Arial, sans-serif",
    cssVar: "--font-syne",
    weight: "800",
  },
  {
    id: "unbounded",
    label: "Unbounded",
    family: "Arial Black, Arial, sans-serif",
    cssVar: "--font-unbounded",
    weight: "700",
  },
  {
    id: "bebas-neue",
    label: "Bebas Neue",
    family: "Impact, Arial Narrow, sans-serif",
    cssVar: "--font-bebas-neue",
    weight: "400",
  },
  {
    id: "orbitron",
    label: "Orbitron",
    family: "Arial, Helvetica, sans-serif",
    cssVar: "--font-orbitron",
    weight: "700",
  },
  {
    id: "archivo-black",
    label: "Archivo Black",
    family: "Arial Black, Arial, sans-serif",
    cssVar: "--font-archivo-black",
    weight: "400",
  },
  {
    id: "chakra-petch",
    label: "Chakra Petch",
    family: "Arial, Helvetica, sans-serif",
    cssVar: "--font-chakra-petch",
    weight: "700",
  },
  {
    id: "space-grotesk",
    label: "Space Grotesk",
    family: "Arial, Helvetica, sans-serif",
    cssVar: "--font-space-grotesk",
    weight: "700",
  },
  {
    id: "michroma",
    label: "Michroma",
    family: "Arial, Helvetica, sans-serif",
    cssVar: "--font-michroma",
    weight: "400",
  },
  {
    id: "righteous",
    label: "Righteous",
    family: "Arial Black, Arial, sans-serif",
    cssVar: "--font-righteous",
    weight: "400",
  },
  {
    id: "yellowtail",
    label: "Yellowtail",
    family: "Brush Script MT, cursive",
    cssVar: "--font-yellowtail",
    weight: "400",
  },
  {
    id: "press-start",
    label: "Press Start",
    family: "Courier New, monospace",
    cssVar: "--font-press-start",
    weight: "400",
  },
];

export const DEFAULT_TEXT_FONT_ID = "syne";

const FALLBACK_FAMILY = "Arial, Helvetica, sans-serif";

function findFont(id: string): TextFontOption {
  return TEXT_FONTS.find((f) => f.id === id) ?? TEXT_FONTS[0];
}

/** Build a canvas-safe font-family list (quoted names, with system fallback). */
function resolveFamily(font: TextFontOption): string {
  const parts: string[] = [];

  if (font.cssVar && typeof document !== "undefined") {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue(font.cssVar)
      .trim();
    for (const piece of splitFontFamilies(raw)) {
      parts.push(quoteFamily(piece));
    }
  }

  for (const piece of splitFontFamilies(font.family)) {
    parts.push(quoteFamily(piece));
  }

  parts.push("Arial", "sans-serif");
  // de-dupe while preserving order
  return [...new Set(parts)].join(", ");
}

function splitFontFamilies(stack: string): string[] {
  if (!stack) return [];
  const out: string[] = [];
  let cur = "";
  let quote: '"' | "'" | null = null;
  for (const ch of stack) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
      continue;
    }
    if (ch === ",") {
      const t = cur.trim();
      if (t) out.push(t);
      cur = "";
      continue;
    }
    cur += ch;
  }
  const t = cur.trim();
  if (t) out.push(t);
  return out;
}

function quoteFamily(name: string): string {
  const bare = name.replace(/^['"]|['"]$/g, "").trim();
  if (!bare) return "Arial";
  if (/^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-sans-serif|ui-monospace|ui-serif|ui-rounded|-apple-system|BlinkMacSystemFont)$/i.test(bare)) {
    return bare;
  }
  return `"${bare.replace(/"/g, "")}"`;
}

function canvasHasInk(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  const { data } = ctx.getImageData(0, 0, w, h);
  // sample every 16th pixel for speed
  for (let i = 3; i < data.length; i += 64) {
    if (data[i] > 8) return true;
  }
  return false;
}

async function ensureFont(weight: string, family: string): Promise<void> {
  if (typeof document === "undefined" || !document.fonts?.load) return;
  try {
    await document.fonts.load(`${weight} 64px ${family}`);
    await document.fonts.ready;
  } catch {
    // Font loading failures fall through to system fallbacks.
  }
}

function paintText(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  size: number,
  weight: string,
  family: string,
): void {
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const pad = size * 0.1;
  const maxW = size - pad * 2;
  const maxH = size - pad * 2;

  let fontSize = Math.min(size * 0.42, (maxH / Math.max(lines.length, 1)) * 0.9);

  const fits = (fs: number) => {
    ctx.font = `${weight} ${fs}px ${family}`;
    const lineH = fs * 1.15;
    if (lines.length * lineH > maxH) return false;
    return lines.every((line) => ctx.measureText(line).width <= maxW);
  };

  while (fontSize > 12 && !fits(fontSize)) {
    fontSize -= 2;
  }
  ctx.font = `${weight} ${fontSize}px ${family}`;

  const lineH = fontSize * 1.15;
  const blockH = lineH * lines.length;
  let y = size / 2 - blockH / 2 + lineH / 2;
  for (const line of lines) {
    // Slight stroke so thin tech faces still leave a solid alpha mask.
    ctx.lineWidth = Math.max(1, fontSize * 0.03);
    ctx.strokeStyle = "#000000";
    ctx.strokeText(line, size / 2, y);
    ctx.fillText(line, size / 2, y);
    y += lineH;
  }
}

/**
 * Rasterize text onto a transparent canvas for the chrome mask pipeline.
 * Black opaque glyphs on clear background — use Transparency mask.
 */
export async function makeTextCanvas(
  text: string,
  fontId: string,
  size = 1024,
): Promise<HTMLCanvasElement> {
  const cleaned = text.replace(/\s+/g, " ").trim().slice(0, 48);
  if (!cleaned) {
    throw new Error("Enter some text first.");
  }

  const font = findFont(fontId);
  const weight = font.weight ?? "700";
  const family = resolveFamily(font);
  const lines = wrapLines(cleaned, 18);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Could not create text canvas.");

  await ensureFont(weight, family);
  paintText(ctx, lines, size, weight, family);

  if (!canvasHasInk(ctx, size, size)) {
    await ensureFont("700", FALLBACK_FAMILY);
    paintText(ctx, lines, size, "700", FALLBACK_FAMILY);
  }

  if (!canvasHasInk(ctx, size, size)) {
    throw new Error("Couldn't draw that text. Try another font.");
  }

  return canvas;
}

function wrapLines(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

export function textFilenameSlug(text: string): string {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "text"
  );
}
