---
description: Bootstrap Open Carrusel — run setup, launch dev server, open browser.
argument-hint: [port]
allowed-tools: Bash(node *), Bash(uname *), Bash(test *), Bash(lsof *), Bash(kill *), Bash(curl *), Bash(open *), Bash(xdg-open *), Bash(cmd.exe *), Bash(npm *), Bash(tail *), AskUserQuestion
---

You are bootstrapping Open Carrusel for the user. Be terse — short status updates only, no preamble.

## Snapshot (these run before you see this prompt)

- Node: !`node --version 2>/dev/null || echo MISSING`
- Platform: !`uname -s 2>/dev/null || echo Windows`
- Port 3100 in use: !`lsof -ti :3100 2>/dev/null && echo YES || echo NO`
- node_modules: !`test -d node_modules && echo YES || echo NO`
- Data seeded: !`test -f data/carousels.json && echo YES || echo NO`

User-supplied port (optional): $ARGUMENTS

## Steps

1. **Verify Node ≥ 20.** Parse the version above. If MISSING or major version < 20, tell the user to install Node 20+ from https://nodejs.org and stop.

2. **Pick port.** Use `$ARGUMENTS` if non-empty, else 3100. Call this `<port>`.

3. **Run setup if needed.** If `node_modules` is NO **or** `Data seeded` is NO:
   - Tell the user: "Running setup (first time installs ~300MB Chromium for export — takes 1–2 minutes)..."
   - Run `OC_SETUP_NO_DEV=1 npm run setup` with a 600s timeout. The env var tells the setup script to skip its own dev-server start (`/start` manages the server itself in step 5). On Windows PowerShell use `$env:OC_SETUP_NO_DEV=1; npm run setup`; on cmd.exe use `set OC_SETUP_NO_DEV=1 && npm run setup`.
   - On failure, surface the error and stop.

4. **Handle port collision.** If `<port>` is in use **and** the listening process is not the dev server you just started, ask via AskUserQuestion: "Port `<port>` is in use. Kill the existing process or pick a different port?" Options: Kill / Different port / Cancel.
   - Kill → `lsof -ti :<port> | xargs kill` then proceed to step 5.
   - Different port → ask for new number, set `<port>`, re-check, then step 5.
   - Cancel → stop.

5. **Launch dev server in background** (only if not already running on `<port>`):
   `npm run dev -- --port <port> > /tmp/open-carrusel-dev.log 2>&1 &` via Bash with `run_in_background: true`.
   (The `dev` script defaults to `--port 3100`; the explicit flag overrides it.)

6. **Wait until ready.** Poll `curl -sf http://localhost:<port>` every 1s until 200 (60s cap). On timeout, run `tail -30 /tmp/open-carrusel-dev.log`, share the output, and stop.

7. **Open browser** based on Platform:
   - Darwin → `open http://localhost:<port>`
   - Linux → `xdg-open http://localhost:<port> 2>/dev/null || true`
   - Windows / MINGW / CYGWIN → `cmd.exe /c start http://localhost:<port>`

8. **Report ready** in two lines (no more):
   > Open Carrusel is running at http://localhost:`<port>`.
   > Logs: `tail -f /tmp/open-carrusel-dev.log` • Stop with `/stop`

Idempotency note: re-running `/start` on a healthy install is fast — the setup script skips already-installed deps and already-seeded data, and the port check skips the launch step if the server is already up.
