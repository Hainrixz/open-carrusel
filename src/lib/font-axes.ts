/**
 * Per-family weight specs for the Google Fonts css2 API.
 *
 * Every family needs its own spec, because css2 is strict about the range form:
 * `wght@200..800` on a family that has no variable axis (Pacifico, Bebas Neue)
 * returns HTTP 400, and the whole request dies — in preview that kills every font
 * on the slide, since all families share one <link>. Asking for a range wider than
 * the family's real axis fails the same way.
 *
 * So: variable families are requested with their actual axis, which is what makes
 * intermediate weights (e.g. font-weight: 650) render instead of snapping to the
 * nearest static instance. Static families are requested with the weights they
 * ship. Unlisted families keep the legacy fixed list, which css2 tolerates.
 *
 * Data from https://fonts.google.com/metadata/fonts — regenerate if fonts are
 * added to POPULAR_FONTS in src/app/api/fonts/route.ts.
 */

/** Variable families: [min, max] of the `wght` axis. */
const VARIABLE_WEIGHT_AXES: Record<string, [number, number]> = {
  Inter: [100, 900],
  "Playfair Display": [400, 900],
  Montserrat: [100, 900],
  Roboto: [100, 900],
  "Open Sans": [300, 800],
  Oswald: [200, 700],
  Raleway: [100, 900],
  Merriweather: [300, 900],
  Nunito: [200, 1000],
  Rubik: [300, 900],
  "Work Sans": [100, 900],
  "DM Sans": [100, 1000],
  "Space Grotesk": [300, 700],
  Outfit: [100, 900],
  Sora: [100, 800],
  Manrope: [200, 800],
  "Plus Jakarta Sans": [200, 800],
  Fraunces: [100, 900],
  "Cormorant Garamond": [300, 700],
  "Libre Baskerville": [400, 700],
  Lora: [400, 700],
  "EB Garamond": [400, 800],
  Bitter: [100, 900],
  Vollkorn: [400, 900],
  Caveat: [400, 700],
  "Dancing Script": [400, 700],
  "JetBrains Mono": [100, 800],
  "Fira Code": [300, 700],
  Geist: [100, 900],
};

/**
 * Families that need an axis spec css2 cannot express as a plain weight list.
 * Instrument Serif ships a real italic file, and the design system leans on it for
 * emphasis, so the italic face has to be requested explicitly or Chromium fakes an
 * oblique by shearing the roman.
 */
const EXPLICIT_AXIS_SPECS: Record<string, string> = {
  "Instrument Serif": "ital,wght@0,400;1,400",
};

/** Static families: the weights actually published. */
const STATIC_WEIGHTS: Record<string, number[]> = {
  Poppins: [100, 200, 300, 400, 500, 600, 700, 800, 900],
  Lato: [100, 300, 400, 700, 900],
  Ubuntu: [300, 400, 500, 700],
  "Bebas Neue": [400],
  Anton: [400],
  "Abril Fatface": [400],
  "Crimson Text": [400, 600, 700],
  "DM Serif Display": [400],
  Pacifico: [400],
  Satisfy: [400],
  "Great Vibes": [400],
  "Space Mono": [400, 700],
};

/** Fallback for families we have no axis data for. */
const LEGACY_WEIGHTS = [300, 400, 500, 600, 700, 800];

/**
 * Build one `family=...` query parameter for the Google Fonts css2 API.
 * Callers join these with `&`.
 */
export function googleFontParam(family: string): string {
  const name = encodeURIComponent(family);

  const explicit = EXPLICIT_AXIS_SPECS[family];
  if (explicit) return `family=${name}:${explicit}`;

  const axis = VARIABLE_WEIGHT_AXES[family];
  if (axis) return `family=${name}:wght@${axis[0]}..${axis[1]}`;

  const weights = STATIC_WEIGHTS[family] ?? LEGACY_WEIGHTS;
  return `family=${name}:wght@${weights.join(";")}`;
}

/** Same family, but with no weight spec at all — the last-resort retry. */
export function googleFontParamBare(family: string): string {
  return `family=${encodeURIComponent(family)}`;
}
