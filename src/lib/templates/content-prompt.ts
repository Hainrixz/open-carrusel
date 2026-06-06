// lib/templates/content-prompt.ts
export function contentPrompt(
  game: string,
  format: string,
  slideNum: number,
  totalSlides: number,
  text: string,
  detail: string
): string {
  const numStr = String(slideNum).padStart(2, '0')
  const totalStr = String(totalSlides).padStart(2, '0')
  return `Create a Content slide (Slide ${slideNum} of ${totalSlides}) as a complete, self-contained HTML document.

CANVAS: exactly 1080×1350px (set on <html> and <body>)
MUST import Rajdhani 700 from Google Fonts.

Design rules (follow EXACTLY):
- Background: #343f4f
- Top border: 5px solid #ED7D31
- Header row: left = "${game} · ${format}" in #888 uppercase 0.6rem, right = "${numStr} / ${totalStr}" in #ED7D31 0.8rem font-weight 700
- Body:
    slide number ${slideNum} as watermark: position absolute, bottom-right, Rajdhani 700, font-size 12rem, opacity 0.08, color #fff, z-index 0
    main text in Rajdhani 700 white 2.8rem, key word(s) in #ED7D31, z-index 1, relative
    green divider: 2px solid #00B050, width 2.5rem, margin 1rem 0
    detail text in #aaa sans-serif 1rem (omit if empty), z-index 1
- Footer: "→" right in #ED7D31 1rem

IMPORTANT: main text MUST be 14 words or fewer.

Content:
Main text: ${text}
Detail: ${detail}

Output ONLY the complete HTML document. No explanation, no code fences.`
}
