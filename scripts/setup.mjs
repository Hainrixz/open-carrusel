#!/usr/bin/env node
// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
// Cross-platform setup for Open Carrusel. Runs on macOS, Linux, and Windows.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
// This script is the entry point for a fresh clone, so it runs *before*
// `npm install` has created node_modules. It must use Node built-ins only;
// importing a dependency here (e.g. cross-spawn) makes setup unrunnable.
// On Windows npm is a .cmd shim, so spawning it needs a shell.
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const IS_WIN = process.platform === "win32";

function log(msg) {
  process.stdout.write(msg + "\n");
}

// Windows ships npm as a .cmd shim, which Node refuses to spawn without a
// shell. Passing an args array alongside shell:true is deprecated (DEP0190)
// because the args are concatenated rather than escaped, so join them here
// instead -- every call site in this file passes hardcoded literals.
function runSync(cmd, args, opts = {}) {
  const res = IS_WIN
    ? spawnSync([cmd, ...args].join(" "), {
        stdio: "inherit",
        shell: true,
        ...opts,
      })
    : spawnSync(cmd, args, { stdio: "inherit", ...opts });
  if (res.error) throw res.error;
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} exited with ${res.status}`);
  }
}

function tryProbeClaude() {
  const cmd = IS_WIN ? "where" : "which";
  try {
    const r = IS_WIN
      ? spawnSync(cmd + " claude", {
          encoding: "utf-8",
          timeout: 2000,
          shell: true,
        })
      : spawnSync(cmd, ["claude"], {
          encoding: "utf-8",
          timeout: 2000,
        });
    if (r.status === 0 && r.stdout) {
      const first = r.stdout.split(/\r?\n/).find((l) => l.trim());
      if (first && fs.existsSync(first.trim())) return first.trim();
    }
  } catch {
    // ignore
  }
  return null;
}

function findClaudePath() {
  if (
    process.env.CLAUDE_CLI_PATH &&
    fs.existsSync(process.env.CLAUDE_CLI_PATH)
  ) {
    return process.env.CLAUDE_CLI_PATH;
  }

  const home = os.homedir();
  const candidates = [];

  if (process.platform === "win32") {
    const appData =
      process.env.APPDATA ?? path.join(home, "AppData", "Roaming");
    const localAppData =
      process.env.LOCALAPPDATA ?? path.join(home, "AppData", "Local");
    candidates.push(
      path.join(appData, "npm", "claude.cmd"),
      path.join(appData, "npm", "claude.exe"),
      path.join(localAppData, "Programs", "claude", "claude.exe")
    );
  } else {
    candidates.push(
      path.join(home, ".local/bin/claude"),
      "/usr/local/bin/claude",
      "/opt/homebrew/bin/claude",
      path.join(home, ".npm-global/bin/claude")
    );
  }

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  return tryProbeClaude();
}

function seedDataFiles() {
  const dataDir = path.join(ROOT, "data");
  const uploadsDir = path.join(ROOT, "public", "uploads");
  const exportsDir = path.join(dataDir, "exports");
  const fontCacheDir = path.join(dataDir, ".font-cache");

  for (const dir of [dataDir, uploadsDir, exportsDir, fontCacheDir]) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const seeds = {
    "brand.json": {
      name: "",
      colors: {
        primary: "#1a1a2e",
        secondary: "#16213e",
        accent: "#e94560",
        background: "#ffffff",
        surface: "#f5f5f5",
      },
      fonts: { heading: "Inter", body: "Inter" },
      customFonts: [],
      logoPath: null,
      styleKeywords: [],
      createdAt: "",
      updatedAt: "",
    },
    "carousels.json": { carousels: [] },
    "templates.json": { templates: [] },
    "staged-actions.json": { actions: [] },
    "style-presets.json": { presets: [] },
  };

  for (const [name, contents] of Object.entries(seeds)) {
    const filePath = path.join(dataDir, name);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(contents), "utf-8");
      log(`  Created ${path.relative(ROOT, filePath)}`);
    }
  }
}

function writeEnvLocal(claudePath) {
  const envPath = path.join(ROOT, ".env.local");
  let existing = "";
  try {
    existing = fs.readFileSync(envPath, "utf-8");
  } catch {
    // file doesn't exist yet
  }

  const lines = existing
    .split(/\r?\n/)
    .filter((line) => !line.startsWith("CLAUDE_CLI_PATH="));

  lines.push(`CLAUDE_CLI_PATH=${claudePath}`);

  while (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();

  fs.writeFileSync(envPath, lines.join("\n") + "\n", "utf-8");
}

async function main() {
  log("🎠 Setting up Open Carrusel...");
  log("");

  log(
    "📦 Installing dependencies (this may take a moment — Puppeteer downloads Chromium ~300MB)..."
  );
  runSync("npm", ["install"]);
  log("");

  log("📁 Creating data directories...");
  seedDataFiles();
  log("");

  log("🔍 Looking for Claude CLI...");
  const claudePath = findClaudePath();
  if (claudePath) {
    log(`  ✅ Found Claude CLI at: ${claudePath}`);
    writeEnvLocal(claudePath);
  } else {
    log("  ⚠️  Claude CLI not found.");
    log("  The app will run without AI features.");
    log(
      "  To enable AI: install Claude CLI from https://docs.anthropic.com/en/docs/claude-code"
    );
    log("  Then set CLAUDE_CLI_PATH in .env.local");
    if (process.platform === "win32") {
      log("  On Windows, run `where claude` to find the path (likely ...\\npm\\claude.cmd).");
    }
  }
  log("");

  if (process.env.OC_SETUP_NO_DEV) {
    log("✅ Setup complete. (Dev server start skipped — caller will handle it.)");
    return;
  }

  log("🚀 Starting Open Carrusel...");
  log("  Open http://localhost:3000 in your browser");
  log("");
  runSync("npm", ["run", "dev"]);
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
