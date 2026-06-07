// lib/templates/content-prompt.ts
export function contentPrompt(
  game: string,
  format: string,
  slideNum: number,
  totalSlides: number,
  text: string,
  detail: string,
  screenshotUrl?: string
): string {
  const numStr = String(slideNum).padStart(2, '0')
  const totalStr = String(totalSlides).padStart(2, '0')
  return `Create a Content slide (Slide ${slideNum} of ${totalSlides}) as a complete, self-contained HTML document.

CANVAS: exactly 1080×1350px (set on <html> and <body>)
MUST import Rajdhani 700 from Google Fonts.

Design rules (follow EXACTLY):
- Background: #343f4f
- Top border: 5px solid #ED7D31
- Header row: left = "${game} · ${format}" in #888 uppercase 0.85rem, right = "${numStr} / ${totalStr}" in #ED7D31 1rem font-weight 700
- Body (flex:1, display:flex, flex-direction:column, justify-content:center, padding: 0 0 4rem 0):
    slide number ${slideNum} as watermark: position absolute, bottom 0, right -1rem, Rajdhani 700, font-size 18rem, opacity 0.06, color #fff, z-index 0, line-height 1
    main text in Rajdhani 700 white 5.5rem line-height 1.15, key word(s) in #ED7D31, z-index 1, relative, margin-bottom 1.5rem
    green divider: 3px solid #00B050, width 3rem, margin-bottom 1.5rem
    detail text in #aaa sans-serif 2rem line-height 1.5 (omit if empty), z-index 1
- Footer: "→" right in #ED7D31 1rem

IMPORTANT: main text MUST be 14 words or fewer.

Content:
Main text: ${text}
Detail: ${detail}
${screenshotUrl && slideNum === 2 ? `\n- Screenshot: <img src="${screenshotUrl}" style="position:absolute;bottom:0;right:0;width:45%;height:60%;object-fit:cover;opacity:0.25;border-radius:4px 0 0 0;z-index:0"> — subtle background presence, low opacity` : ''}
Output ONLY the complete HTML document. No explanation, no code fences.`
}
