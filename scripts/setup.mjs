#!/usr/bin/env node
// Cross-platform setup for Open Carrusel. Runs on macOS, Linux, and Windows.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crossSpawn from "cross-spawn";

const ROOT = process.cwd();

function log(msg) {
  process.stdout.write(msg + "\n");
}

function runSync(cmd, args, opts = {}) {
  const res = crossSpawn.sync(cmd, args, { stdio: "inherit", ...opts });
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} exited with ${res.status}`);
  }
}

function tryProbeClaude() {
  const isWin = process.platform === "win32";
  const cmd = isWin ? "where" : "which";
  try {
    const r = crossSpawn.sync(cmd, ["claude"], {
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

// Commented placeholders so the optional image keys are discoverable in .env.local
// itself, instead of only in the README.
const MAGNIFIC_PLACEHOLDER = [
  "",
  "# Slide imagery (optional) — https://www.magnific.com/user/api-keys",
  "# MAGNIFIC_API_KEY=",
  "# Only needed if you expose this dev server through a tunnel:",
  "# MAGNIFIC_WEBHOOK_URL=https://<your-tunnel>/api/images/webhook",
  "# MAGNIFIC_WEBHOOK_SECRET=",
];

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

  if (claudePath) lines.unshift(`CLAUDE_CLI_PATH=${claudePath}`);

  if (!existing.includes("MAGNIFIC_API_KEY")) {
    lines.push(...MAGNIFIC_PLACEHOLDER);
  }

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
  writeEnvLocal(claudePath);
  if (claudePath) {
    log(`  ✅ Found Claude CLI at: ${claudePath}`);
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
  log("  Open http://localhost:3100 in your browser");
  log("");
  runSync("npm", ["run", "dev"]);
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
