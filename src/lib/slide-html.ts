// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
import type { AspectRatio } from "@/types/carousel";
import { DIMENSIONS } from "@/types/carousel";

/**
 * Extract Google Font family names from slide HTML.
 * Looks for font-family declarations in inline styles and <style> tags.
 */
export function extractFontFamilies(html: string): string[] {
  const families = new Set<string>();
  // Match font-family: "Font Name" or font-family: 'Font Name' or font-family: Font Name
  const regex = /font-family:\s*['"]?([^;'"}\n]+?)['"]?\s*[;}"]/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const raw = match[1].trim();
    // Split on commas and take non-generic font names
    const generics = new Set([
      "serif",
      "sans-serif",
      "monospace",
      "cursive",
      "fantasy",
      "system-ui",
      "inherit",
      "initial",
      "unset",
    ]);
    for (const part of raw.split(",")) {
      const name = part.trim().replace(/['"]/g, "");
      if (name && !generics.has(name.toLowerCase())) {
        families.add(name);
      }
    }
  }
  return Array.from(families);
}

/**
 * Wraps slide body HTML into a full HTML document at the correct dimensions.
 * This is THE shared rendering contract between preview (iframe) and export (Puppeteer).
 */
export function wrapSlideHtml(
  slideHtml: string,
  aspectRatio: AspectRatio,
  options?: { inlineFontCss?: string }
): string {
  const { width, height } = DIMENSIONS[aspectRatio];
  const fontFamilies = extractFontFamilies(slideHtml);

  let fontBlock = "";
  if (options?.inlineFontCss) {
    // For export: use inlined base64 @font-face CSS
    fontBlock = `<style>${options.inlineFontCss}</style>`;
  } else if (fontFamilies.length > 0) {
    // For preview: use Google Fonts CDN link
    const params = fontFamilies
      .map(
        (f) =>
          `family=${encodeURIComponent(f)}:wght@300;400;500;600;700;800`
      )
      .join("&");
    fontBlock = `<link href="https://fonts.googleapis.com/css2?${params}&display=swap" rel="stylesheet">`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=${width}, initial-scale=1">
  ${fontBlock}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${width}px; height: ${height}px; overflow: hidden; }
  </style>
</head>
<body>
  ${slideHtml}
</body>
</html>`;
}
