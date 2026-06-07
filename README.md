# tiduin-carousel

Automatisiertes Tool zum Generieren und Veröffentlichen von Instagram-Carousels für den Gaming-Creator [Tiduin](https://www.instagram.com/tiduin).

Basiert auf [open-carrusel](https://github.com/Hainrixz/open-carrusel) (Next.js 16, Claude CLI, Puppeteer) und erweitert es um einen vollständigen Publish-Workflow.

---

## Features

- **Carousel-Generierung** — Claude CLI erstellt Slide-HTML automatisch auf Basis von Spiel, Thema und Format
- **8-Slide-Struktur** — Hook → 6 Content-Slides → CTA, mit Rajdhani-Font und Tiduin-Brandfarben
- **Video-Input** — Videoclip hochladen, Whisper transkribiert automatisch (Gaming-PC Server oder lokaler Fallback)
- **News-Intake** — `/api/intake-news` nimmt JSON von externen Agenten entgegen und erstellt Draft-Posts vollautomatisch
- **Screenshot-Integration** — optionaler Game-Screenshot wird als subtiler Hintergrund in Hook & Slide 2 eingeblendet
- **JPEG-Export** — Puppeteer rendert jedes Slide auf 1080×1350 px, Sharp konvertiert zu JPEG
- **Queue-System** — JSON-basierte Warteschlange mit Mutex-geschützten Schreibzugriffen
- **Scheduler** — node-cron prüft jede Minute, ob ein Post fällig ist
- **Instagram-Publish** — vollautomatischer 3-Schritt-Publish via Instagram Graph API v25.0
- **SFTP-Upload** — temporäres öffentliches Hosting der Bilder vor dem API-Aufruf
- **Dashboard** — Übersicht aller geplanten, veröffentlichten und fehlgeschlagenen Posts (inkl. Fehlermeldung)
- **Brand-Voice-Checker** — Blacklist-Prüfung gegen Tiduin-Sprachregeln

---

## Voraussetzungen

| Anforderung | Details |
|---|---|
| Node.js | ≥ 20 |
| [Claude CLI](https://docs.anthropic.com/en/docs/claude-code) | Muss im PATH verfügbar sein (`claude --version`) |
| Instagram Business-Konto | mit verknüpfter Facebook-Seite |
| Instagram Graph API Access Token | Long-Lived Token (60 Tage) |
| SFTP-Server | für temporäres öffentliches Bild-Hosting |
| Whisper CLI *(optional)* | für lokale Video-Transkription (`pip install openai-whisper`) |
| Gaming-PC FastAPI-Server *(optional)* | schnellere Transkription via `WHISPER_SERVER_URL` |

> **Kein Anthropic API-Key nötig.** Das Tool nutzt die lokal installierte Claude CLI direkt als Subprocess — kein `ANTHROPIC_API_KEY` erforderlich.

---

## Installation

```bash
git clone https://github.com/Tiduin/tiduin-carousel.git
cd tiduin-carousel
npm install
```

Konfigurationsdatei anlegen:

```bash
cp .env.local.example .env.local
```

Dann `.env.local` befüllen (siehe Abschnitt Konfiguration).

---

## Konfiguration

```env
# Instagram Graph API
INSTAGRAM_ACCESS_TOKEN=EAAxxxxx...
INSTAGRAM_BUSINESS_ACCOUNT_ID=123456789

# SFTP (für temporäres öffentliches Hosting der JPEGs)
FTP_HOST=meinserver.de
FTP_USER=ftpuser
FTP_PASSWORD=geheim
PUBLIC_BASE_URL=https://meinserver.de/tmp

# Optional: falls claude nicht im PATH liegt
# CLAUDE_CLI_PATH=/usr/local/bin/claude

# Optional: Whisper Gaming-PC Server URL (Phase 2)
# WHISPER_SERVER_URL=http://gaming-pc:8765
```

---

## Entwicklungsserver starten

```bash
npm run dev
```

Öffnet [http://localhost:3000](http://localhost:3000). Der Cron-Worker läuft automatisch mit.

---

## Workflow

```
Neuer Post → Outline generieren → Slides rendern → JPEG-Export → Review → Einplanen → Auto-Publish
```

### 1. Neuer Post anlegen

`/new-post` → Spiel, Thema und Format auswählen → Claude generiert die 8-Slide-Outline + Caption → Slides werden als HTML gerendert und als JPEG exportiert.

### 2. Review & Einplanung

`/review/[id]` → Slides prüfen, Caption bearbeiten, Zeitslot wählen (oder eigenen Termin setzen) → „Freigeben & Einplanen".

### 3. Automatische Veröffentlichung

Der Cron-Worker prüft jede Minute `data/queue.json`. Bei Fälligkeit:
1. JPEGs per SFTP hochladen
2. Instagram Graph API: Bild-Container erstellen
3. Carousel-Container erstellen
4. `media_publish` aufrufen
5. SFTP-Dateien löschen, Post als `published` markieren

---

## Architektur

```
src/
├── app/
│   ├── api/
│   │   ├── generate-outline/   Claude CLI → 8-Slide-JSON + Caption
│   │   ├── auto-fill/          Claude CLI → HTML pro Slide
│   │   ├── export-jpeg/        Puppeteer + Sharp → JPEG 1080×1350
│   │   ├── schedule/           POST in Queue schreiben
│   │   ├── queue/              GET Queue (mit Slide-URLs)
│   │   ├── delete-post/        DELETE aus Queue + Draft-Ordner
│   │   ├── slide-image/        JPEG-Datei ausliefern
│   │   └── token-status/       Instagram Token-Ablauf prüfen
│   ├── dashboard/              Post-Übersicht
│   ├── new-post/               4-Schritt-Erstellungsflow
│   └── review/[id]/            Freigabe-Screen
├── lib/
│   ├── claude-cli.ts           runClaude() — CLI-Subprocess-Helper
│   ├── claude-path.ts          Claude-Binary-Pfad-Erkennung
│   ├── queue.ts                Mutex-sichere Queue-Verwaltung
│   ├── brand-voice.ts          Blacklist-Checker
│   ├── instagram.ts            Graph API Publish + Token-Check
│   ├── sftp.ts                 Upload / Delete
│   ├── publisher.ts            Orchestrierung: SFTP → Instagram → Cleanup
│   ├── cron.ts                 node-cron Worker
│   └── templates/
│       ├── hook-prompt.ts      Hook-Slide HTML-Prompt
│       ├── content-prompt.ts   Content-Slide HTML-Prompt
│       └── cta-prompt.ts       CTA-Slide HTML-Prompt
data/
├── brand.json                  Brand-Konfiguration (Farben, Fonts)
├── queue.json                  Aktuelle Post-Queue
└── drafts/[postId]/            JPEG-Dateien + caption.md pro Post
server.ts                       Custom Next.js Server mit Cron-Start
```

---

## Tests

```bash
npm run test
```

20 Tests in 4 Dateien (queue, brand-voice, sftp, instagram) — alle mit Vitest.

---

## Brand-Konfiguration

`data/brand.json` steuert Farben und Fonts:

```json
{
  "colors": {
    "background": "#343f4f",
    "primary": "#ED7D31",
    "secondary": "#00B050"
  },
  "fonts": {
    "heading": "Rajdhani",
    "body": "Inter"
  }
}
```

---

## Instagram Token erneuern

Long-Lived Tokens laufen nach 60 Tagen ab. Das Dashboard zeigt ein Warning-Banner wenn weniger als 7 Tage verbleiben.

Token erneuern via Graph API:

```
GET https://graph.facebook.com/v25.0/oauth/access_token
   ?grant_type=fb_exchange_token
   &client_id={APP_ID}
   &client_secret={APP_SECRET}
   &fb_exchange_token={CURRENT_TOKEN}
```

Neuen Token in `.env.local` eintragen und Server neu starten.

---

## Lizenz

MIT — Fork von [open-carrusel](https://github.com/Hainrixz/open-carrusel) by Hainrixz.
