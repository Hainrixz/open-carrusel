---
description: Diagnose Open Carrusel setup problems (Node, Claude CLI, deps, data, port).
allowed-tools: Bash(node *)
---

!`node scripts/doctor.mjs 2>&1; exit 0`

If any check above shows ✗ or a warning, suggest the most likely fix in one line:
- Node version too low → install Node 20+ from https://nodejs.org
- Claude CLI missing → install Claude Code from https://docs.anthropic.com/en/docs/claude-code
- Dependencies missing → run `/start` (or `npm install`)
- Data files missing → run `/start` (or `npm run setup`)
- Port 3100 in use → run `/stop` if it's a leftover dev server, or use `/start 3200` to pick another port

If everything is ✓, just say "All checks passed."
