import type { BrandColors } from "@/types/brand";

/**
 * Derives an extended, editorial-grade palette from the 5 brand colors.
 *
 * The brand config only carries primary/secondary/accent/background/surface, which is
 * not enough to build a premium layout: there is no deep "ink" ground, no warm paper,
 * no hairline tone, and no accent that survives on a dark background. The agent used to
 * invent those hexes per slide, which is exactly why carousels drifted between builds.
 *
 * Everything here is deterministic, and the accent variants are pushed until they pass
 * 4.5:1 against their own ground, so the contrast rule in the system prompt holds by
 * construction instead of by instruction.
 */

export interface DerivedPalette {
  /** Deep ground, brand hue. Backgrounds for hook, climax, CTA. */
  ink: string;
  /** One step up from ink: raised blocks, image mattes. */
  inkRaised: string;
  /** Body text on ink. */
  inkText: string;
  /** Secondary text on ink. */
  inkMuted: string;
  /** Hairline on ink. */
  inkLine: string;
  /** Warm off-white ground. */
  paper: string;
  /** One step down from paper: quote blocks, insets. */
  paperRaised: string;
  /** Body text on paper. */
  paperText: string;
  /** Secondary text on paper. */
  paperMuted: string;
  /** Hairline on paper. */
  paperLine: string;
  /** Accent that passes 4.5:1 on ink. */
  accentOnInk: string;
  /** Accent that passes 4.5:1 on paper. */
  accentOnPaper: string;
  /** Bright brand tint, for large display type on ink only. */
  highlight: string;
  /** Scrim gradient for full-bleed images on ink. */
  scrim: string;
}

type Rgb = { r: number; g: number; b: number };
type Hsl = { h: number; s: number; l: number };

function parseHex(hex: string): Rgb {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function toHex({ r, g, b }: Rgb): string {
  const c = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: h * 60, s: s * 100, l: l * 100 };
}

function hslToRgb({ h, s, l }: Hsl): Rgb {
  const hn = ((h % 360) + 360) % 360 / 360;
  const sn = Math.max(0, Math.min(100, s)) / 100;
  const ln = Math.max(0, Math.min(100, l)) / 100;
  if (sn === 0) return { r: ln * 255, g: ln * 255, b: ln * 255 };
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  const channel = (t: number) => {
    let tn = t;
    if (tn < 0) tn += 1;
    if (tn > 1) tn -= 1;
    if (tn < 1 / 6) return p + (q - p) * 6 * tn;
    if (tn < 1 / 2) return q;
    if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
    return p;
  };
  return {
    r: channel(hn + 1 / 3) * 255,
    g: channel(hn) * 255,
    b: channel(hn - 1 / 3) * 255,
  };
}

function hsl(h: number, s: number, l: number): string {
  return toHex(hslToRgb({ h, s, l }));
}

function toHsl(hex: string): Hsl {
  return rgbToHsl(parseHex(hex));
}

/** Linear sRGB mix. t=0 returns a, t=1 returns b. */
export function mix(a: string, b: string, t: number): string {
  const ra = parseHex(a);
  const rb = parseHex(b);
  return toHex({
    r: ra.r + (rb.r - ra.r) * t,
    g: ra.g + (rb.g - ra.g) * t,
    b: ra.b + (rb.b - ra.b) * t,
  });
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two opaque colors, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Walks lightness in `step` increments until the color clears `target` contrast
 * against `ground`. Saturation is floored so the accent does not wash out on the way.
 */
function forceContrast(
  color: string,
  ground: string,
  target: number,
  direction: "lighter" | "darker",
  minSaturation: number
): string {
  const base = toHsl(color);
  // A near-neutral input stays neutral: forcing saturation onto black would read its
  // hue as 0 and hand back red.
  const s = base.s < 8 ? base.s : Math.max(base.s, minSaturation);
  const step = direction === "lighter" ? 3 : -3;
  let l = base.l;
  let candidate = hsl(base.h, s, l);
  for (let i = 0; i < 34; i++) {
    if (contrastRatio(candidate, ground) >= target) return candidate;
    l += step;
    if (l < 4 || l > 96) break;
    candidate = hsl(base.h, s, l);
  }
  return candidate;
}

/** Picks the hue that carries the brand: accent first, primary as fallback. */
function brandHue(colors: BrandColors): { h: number; s: number } {
  const accent = toHsl(colors.accent);
  if (accent.s >= 12) return { h: accent.h, s: accent.s };
  const primary = toHsl(colors.primary);
  if (primary.s >= 12) return { h: primary.h, s: primary.s };
  return { h: 210, s: 20 };
}

export function derivePalette(colors: BrandColors): DerivedPalette {
  const { h, s } = brandHue(colors);

  // Ink: brand hue, held dark enough that large display type reads at 15:1+.
  const ink = hsl(h, Math.max(18, Math.min(s, 46)), 10);
  const inkRaised = hsl(h, Math.max(16, Math.min(s, 40)), 15);

  // Paper: warm off-white carrying a trace of the brand hue. The tint is applied as an
  // already-desaturated wash, because mixing the raw brand color into a 97% lightness
  // cream overpowers the warmth and lands on gray.
  const paper = mix(hsl(38, 30, 97), hsl(h, 14, 92), 0.12);
  const paperRaised = mix(paper, ink, 0.06);

  const inkText = mix("#ffffff", ink, 0.06);
  const paperText = ink;
  // Secondary text is pushed until it clears 4.5:1, so "contraste acima de 4.5:1" in the
  // prompt is a property of the palette rather than something the agent has to judge.
  // Secondary text on ink carries a trace of the brand hue: a neutral gray next to a
  // colored ground reads as dirty rather than quiet.
  const inkMuted = forceContrast(hsl(h, 10, 68), ink, 4.5, "lighter", 0);
  const paperMuted = forceContrast(mix(ink, paper, 0.42), paper, 4.5, "darker", 0);

  return {
    ink,
    inkRaised,
    inkText,
    inkMuted,
    inkLine: "rgba(255,255,255,0.16)",
    paper,
    paperRaised,
    paperText,
    paperMuted,
    paperLine: mix(paper, ink, 0.14),
    accentOnInk: forceContrast(colors.accent, ink, 4.5, "lighter", 45),
    accentOnPaper: forceContrast(colors.accent, paper, 4.5, "darker", 40),
    highlight: forceContrast(colors.primary, ink, 7, "lighter", 35),
    // Bottom-weighted on purpose: the photo has to survive in the top half, and the text
    // block is anchored low. A scrim that goes opaque at mid-height just deletes the image.
    scrim: `linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.04) 30%, ${mix(ink, "#000000", 0.25)}B8 62%, ${ink} 92%)`,
  };
}
