# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Open Carrusel

Local-first, single-user AI Instagram carousel builder. Next.js 16 (Turbopack) + React 19 + TypeScript 5 + Tailwind v4. No auth, no database, no cloud — everything runs on localhost against JSON files.

> **Next.js 16 caveat** (also in [AGENTS.md](AGENTS.md)): APIs and conventions differ from older Next.js. Read the relevant guide in `node_modules/next/dist/docs/` before writing framework-level code.

## Commands

```bash
npm run setup     # npm install + seed /data/*.json + detect Claude CLI → .env.local
npm run dev       # dev server on :3100
npm run build     # production build — run this before opening a PR
npm run lint      # eslint (flat config, next core-web-vitals + typescript)
npm run doctor    # zero-dep env diagnostic; works before npm install
```

There is no test suite. Verification is `npm run build` + `npm run lint` + manual export round-trip.

Claude Code slash commands live in [.claude/commands/](.claude/commands/): `/start [port]`, `/stop [port]`, `/reset`, `/doctor`.

## Architecture

### The AI loop is a subprocess that calls the app's own HTTP API

[src/app/api/chat/route.ts](src/app/api/chat/route.ts) spawns the **Claude CLI** (`-p ... --output-format stream-json --include-partial-messages`), parses its NDJSON stdout, and re-emits SSE to the browser. This is the single most unusual thing about the codebase:

- Claude does **not** write slides through in-process function calls. It `curl`s `http://localhost:3100/api/carousels/{id}/slides` using its `Bash` tool. The origin in those curl recipes is derived from the request's `Host` header, so the port follows whatever the dev server is on. Adding an agent capability therefore means adding an HTTP route **and** documenting the curl invocation in the system prompt.
- Allowed tools: `Bash`, `WebFetch`, `Read`. Capped by `--max-budget-usd 1.00` and an 8-minute subprocess kill timer.
- Session continuity via `--resume <sessionId>`; the id is extracted from the CLI's `system/init` and `result` events and returned to the client in the `done` SSE event, then stored on the carousel as `chatSessionId`.
- Windows `.cmd`/`.bat` shims are spawned via `cross-spawn`; POSIX uses plain `spawn`. Path discovery is [src/lib/claude-path.ts](src/lib/claude-path.ts) (`CLAUDE_CLI_PATH` env → known install dirs → `command -v`/`where`).

[src/lib/chat-system-prompt.ts](src/lib/chat-system-prompt.ts) rebuilds the system prompt on **every** request from live brand + carousel + style-preset state. It is effectively the agent's spec: copy doctrine, the gated 4-stage flow, curl recipes, and slide HTML rules all live there. Keep it in sync with the actual routes.

The prompt is **written in pt-BR and is not autonomous**. It runs a gated flow: ângulos → hook (6 headlines) → copy as plain text → build via curl → optional caption. Each gate waits for explicit user approval, which works because `--resume <sessionId>` carries the stage across turns. Design is deliberately *not* a conversation topic: the agent applies `brand.json` plus the active style preset silently, and the visual system section is marked as execution-only. The chat renders plain text ([ChatMessage.tsx](src/components/chat/ChatMessage.tsx) uses `whitespace-pre-wrap`, no markdown), so prompt output formats must avoid tables. Copy rules ban invented data and the em-dash; the prompt prose itself avoids em-dashes so the model has nothing to imitate.

### The visual system is generated, not written by hand

[src/lib/slide-design-system.ts](src/lib/slide-design-system.ts) builds the design half of the prompt from live state, and [src/lib/palette.ts](src/lib/palette.ts) derives the colors it hands over. This exists because adjectives ("gradiente dá profundidade") produced generic slides: the agent now receives exact hexes, an exact type scale, an ink/paper ground rhythm, 8 archetypes, and two complete HTML exemplars.

- `derivePalette()` turns the 5 brand colors into 14 tokens (ink ground, warm paper, hairlines, two accent variants). Secondary text and both accents are walked through `forceContrast()` until they clear 4.5:1 against their own ground, so contrast is a property of the palette, not an instruction the model has to honor.
- The scale scales with slide height, so 9:16 is not under-set and 1:1 not over-set.
- **The two exemplars carry most of the output quality.** They encode the corrections that mattered in QA: the main block is anchored low with `margin-bottom:auto` (never `space-between`, which parks it mid-canvas and opens dead space), photo slides keep the top clear because a bright sky eats any text placed there, the scrim is bottom-weighted so the image survives, and the logo file is used only on paper (inverting a logo that ships its own background destroys it). Re-render before and after editing them.
- `ACCENT_SERIF` (Instrument Serif) needs its italic requested explicitly through `EXPLICIT_AXIS_SPECS` in [src/lib/font-axes.ts](src/lib/font-axes.ts), otherwise Chromium fakes an oblique.

### Slide imagery (Magnific, optional)

With `MAGNIFIC_API_KEY` set, the prompt gains an art-direction section and the agent illustrates 2 to 3 slides per carousel. [src/lib/magnific.ts](src/lib/magnific.ts) posts to Seedream V5 Lite and **polls** `GET /{task-id}`, because localhost cannot receive a webhook. `POST /api/images/generate` runs up to 4 prompts in parallel, crops each result to the carousel's exact pixel size with sharp, and writes JPEG into `public/uploads/` — so export inlining and the preview iframe treat generated images exactly like uploads.

`/api/images/webhook` is the optional other half: HMAC-SHA256 verified, it drops finished tasks into the `globalThis`-backed cache in [src/lib/magnific-tasks.ts](src/lib/magnific-tasks.ts), which the poll loop checks first. It only does anything when the dev server is tunneled and `MAGNIFIC_WEBHOOK_URL` / `MAGNIFIC_WEBHOOK_SECRET` are set.

Without the key the feature is invisible: `buildSystemPrompt(..., imagesEnabled=false)` omits the whole section rather than letting the agent reference a route that returns 503.

### wrapSlideHtml() is the rendering contract

Slides store **body-level HTML only** (no `<!DOCTYPE>`/`<html>`/`<head>`/`<body>`). [src/lib/slide-html.ts](src/lib/slide-html.ts) wraps that body identically for both consumers, which is why preview matches export:

- **Preview** — [SlideRenderer.tsx](src/components/editor/SlideRenderer.tsx) injects into an iframe with `sandbox=""` (no JS, no same-origin). Fonts load from the Google Fonts CDN.
- **Export** — [src/lib/export-slides.ts](src/lib/export-slides.ts) rewrites `/uploads/*` refs to base64 data URIs, swaps CDN fonts for base64 `@font-face` CSS from [src/lib/fonts.ts](src/lib/fonts.ts) (cached in `data/.font-cache/`), then screenshots via a singleton Puppeteer browser (recycled every 50 exports) at exact pixel dimensions and zips with archiver.

`extractFontFamilies()` regex-scrapes `font-family:` declarations to decide which Google Fonts to load — a font only works if it appears in a `font-family` declaration in the slide HTML.

Changing `wrapSlideHtml()` changes both paths at once. Test the export round-trip after touching it.

### Storage

[src/lib/data.ts](src/lib/data.ts) is the only module that touches JSON on disk: per-file `async-mutex` + tmp-file-then-`rename` atomic writes. Never `fs.writeFile` a data file directly; go through `readData`/`readDataSafe`/`writeData`.

Files under `data/` (gitignored, seeded by `scripts/setup.mjs`): `brand.json`, `carousels.json`, `templates.json`, `style-presets.json`, `staged-actions.json`. Uploads go to `public/uploads/` (also gitignored).

Domain modules on top of it: `carousels.ts` (slide CRUD + per-slide version history), `brand.ts`, `templates.ts`, `style-presets.ts`, `staged-actions.ts` (backend-only today — `export_png` approval flow with no UI consumer yet).

### Constraints from `src/types/carousel.ts`

`MAX_SLIDES = 20`, `MAX_VERSIONS = 5` (per-slide undo depth). Dimensions: `1:1` → 1080×1080, `4:5` → 1080×1350, `9:16` → 1080×1920.

## API routes

| Route | Purpose |
|---|---|
| `POST /api/chat` | Spawn Claude CLI, stream SSE |
| `GET /api/chat/check` | Is the Claude CLI reachable |
| `GET/POST /api/carousels` · `GET/PUT/DELETE /api/carousels/[id]` | Carousel CRUD |
| `POST /api/carousels/[id]/duplicate` | Copy a carousel |
| `POST /api/carousels/[id]/slides` · `PUT /api/carousels/[id]/slides` | Add slide · reorder (`{ slideIds: [...] }`) |
| `PUT/DELETE /api/carousels/[id]/slides/[slideId]` · `POST .../undo` | Update, delete, revert one version |
| `PUT /api/carousels/[id]/caption` | Caption + hashtags |
| `GET/POST/DELETE /api/carousels/[id]/references` | Reference images (stores `absPath` so Claude can `Read` them) |
| `POST /api/carousels/[id]/export` | Puppeteer → PNG → ZIP |
| `GET/PUT /api/brand` · `GET/POST /api/templates` · `/api/templates/[id]`, `/[id]/use` | Config, templates |
| `GET/POST /api/style-presets` · `/api/style-presets/[id]` | Reusable design-rule presets injected into the system prompt |
| `GET/POST /api/staged-actions` · `/api/staged-actions/[id]` | Staged action queue |
| `POST /api/upload` | PNG/JPG/WebP only, max 10 MB |
| `GET /api/fonts` | Curated Google Fonts list |
| `POST /api/images/generate` | Magnific text-to-image → cropped JPEG in `public/uploads/` |
| `GET /api/images/check` | Is `MAGNIFIC_API_KEY` set |
| `POST /api/images/webhook` | Optional signed Magnific callback (tunnel only) |

## Conventions

- Components ≤ ~300 lines. Types in `src/types/`, libs in `src/lib/`, components in `src/components/` grouped by feature (`brand/`, `chat/`, `editor/`, `templates/`, `layout/`, `ui/`).
- `cn()` from [src/lib/utils.ts](src/lib/utils.ts) for class merging; `generateId()`/`now()` from the same module for ids and timestamps.
- Slide iframes always `sandbox=""`.
- Animation is CSS-first (Emil Kowalski style): use the `oc-*` utilities and easing variables already defined in [src/app/globals.css](src/app/globals.css); respect `prefers-reduced-motion`. Tailwind v4 theme is configured in that same CSS file, not a JS config.
- [next.config.ts](next.config.ts) sets a CSP that only allows `fonts.googleapis.com` / `fonts.gstatic.com` as external origins, and marks `sharp`, `archiver`, `puppeteer` as `serverExternalPackages`. New external fetches need a CSP entry.

## Slide HTML rules (what the agent must emit)

Body-level HTML only. Inline styles or `<style>` tags, no external CSS. Google Font family names in `font-family` declarations (that's how fonts get loaded). Images as `/uploads/{filename}`, never an external URL. No `<script>` — the sandbox blocks it. Target the carousel's aspect-ratio dimensions exactly.
