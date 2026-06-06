// lib/templates/cta-prompt.ts
export function ctaPrompt(streamingDays: string, question: string): string {
  return `Create a CTA slide (final slide) as a complete, self-contained HTML document.

CANVAS: exactly 1080×1350px
MUST import Rajdhani 700 from Google Fonts.

Design rules (follow EXACTLY):
- Background: #343f4f
- Top border: 5px, linear-gradient left→right #00B050 → #ED7D31
- Body (centered):
    eyebrow "Mehr Gaming-Tipps" in #00B050 uppercase 0.8rem letter-spacing 0.15em
    headline "Ich stream live auf Twitch" in Rajdhani 700 white 2.8rem, "live auf Twitch" in #ED7D31
    streaming days: "${streamingDays}" in Rajdhani 700 #aaa 1.4rem
    CTA button: background #ED7D31, text "twitch.tv/tiduin" in Rajdhani 700 white 1.4rem, border-radius 8px, padding 0.75rem 2rem, margin-top 1.5rem
    question text: italic #888 1rem, margin-top 2rem
- Footer: "@tiduin · instagram" centered in #555 0.7rem

Content:
Streaming days: ${streamingDays}
Question: ${question}

Output ONLY the complete HTML document. No explanation, no code fences.`
}
