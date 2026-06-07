# Changelog

## [Unreleased] — Phase 2 (2026-06-07)

### Neu

- **Video-Input**: Neuer "Videoclip"-Tab in `/new-post` — Video hochladen, Whisper transkribiert automatisch, Transcript fließt in Outline-Generierung ein
- **Whisper-Client** (`src/lib/whisper.ts`): Gaming-PC FastAPI-Server (`WHISPER_SERVER_URL`) mit lokalem Whisper-CLI-Fallback
- **`/api/transcribe`**: Multipart-Video → Transcript-Text (max 300s Timeout)
- **`/api/intake-news`**: Externer JSON-Input für News-Agenten → Fire-and-forget Pipeline → Draft-Post in Queue
- **Screenshot-Integration**: Optionaler Game-Screenshot in neuer-Post-Form; wird als subtiler Hintergrund in Hook-Slide und Slide 2 eingeblendet

### Verbessert

- **Dashboard**: Fehlermeldung bei fehlgeschlagenen Posts jetzt sichtbar (rot, unter dem Datum)
- **Slide-Templates**: Font-Größen für 1080×1350 px Canvas skaliert (Headline `6rem`, Subline `2.5rem`)
- **Brand-CSS**: `--background: #111827`, `--ring: #ED7D31` und weitere CSS-Variablen auf Tiduin-Farben gesetzt
- **Claude CLI**: Error-Detail zeigt jetzt auch stdout wenn stderr leer ist

### Sicherheit

- `screenshotUrl` in `/api/auto-fill` wird gegen `/uploads/<uuid>.png`-Pattern validiert, um Prompt-Injection zu verhindern

---

## Phase 1 (vor 2026-06-07)

- Carousel-Generierung mit Claude CLI (8-Slide-Struktur)
- JPEG-Export via Puppeteer + Sharp (1080×1350 px)
- Queue-System mit Mutex-gesichertem JSON-Storage
- Instagram Graph API Publish-Workflow
- SFTP-Upload für temporäres Bild-Hosting
- Dashboard mit Post-Übersicht und Token-Warning
- Review-Screen mit Caption-Editing und Scheduling
- 3 Caption-Varianten
- Kommentar-Frage im CTA-Slide
