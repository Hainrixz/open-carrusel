// lib/templates/hook-prompt.ts
export function hookPrompt(game: string, headline: string, subtitle: string): string {
  return `Create a Hook slide (Slide 1 of 8) as a complete, self-contained HTML document.

CANVAS: exactly 1080×1350px (set on <html> and <body>)
MUST import Rajdhani 700 from Google Fonts.

Design rules (follow EXACTLY):
- Background: #343f4f, fills full canvas
- Top border: 5px, linear-gradient left→right #ED7D31 → #00B050
- Header row (padding: 1rem): left = game name in #ED7D31 uppercase 0.75rem, right = "Tiduin" in #888 0.75rem
- Body (centered vertically):
    eyebrow text in #00B050 uppercase 0.8rem letter-spacing 0.15em
    headline in Rajdhani 700 white 3.5rem, key word in #ED7D31
    optional subtitle in #aaa 1rem (omit if empty)
- Footer: "Swipe für alle Tipps →" left in #888 0.8rem, "→" right in #ED7D31

Content:
Game: ${game}
Headline: ${headline}
Subtitle: ${subtitle}

Output ONLY the complete HTML document. No explanation, no code fences.`
}
