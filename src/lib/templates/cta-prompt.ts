// lib/templates/cta-prompt.ts
export function ctaPrompt(streamingDays: string, question: string): string {
  return `Create a CTA slide (final slide) as a complete, self-contained HTML document.

CANVAS: exactly 1080×1350px
MUST import Rajdhani 700 from Google Fonts.

Design rules (follow EXACTLY):
- Background: #343f4f
- Top border: 5px, linear-gradient left→right #00B050 → #ED7D31
- Body (flex:1, display:flex, flex-direction:column, justify-content:center, align-items:center, text-align:center, gap:1.8rem):
    eyebrow "Mehr Gaming-Tipps" in #00B050 uppercase 1.1rem letter-spacing 0.2em
    headline "Ich stream live auf Twitch" in Rajdhani 700 white 5.5rem line-height 1.1, "live auf Twitch" in #ED7D31
    streaming days: "${streamingDays}" in Rajdhani 700 #aaa 2.2rem
    CTA button: background #ED7D31, text "twitch.tv/tiduin" in Rajdhani 700 white 2rem, border-radius 8px, padding 1rem 3rem
    question text: italic #888 1.6rem
- Footer: "@tiduin · instagram" centered in #555 0.7rem

Content:
Streaming days: ${streamingDays}
Question: ${question}

Output ONLY the complete HTML document. No explanation, no code fences.`
}
