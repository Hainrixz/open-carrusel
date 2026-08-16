#!/usr/bin/env node
// Open Carrusel — environment diagnostic.
// Pure Node, no dependencies, safe to run pre-`npm install`.
// Exit 0 if everything required is OK; exit 1 on any required failure.

import { existsSync, readFileSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { homedir, platform } from "node:os";
import { join } from "node:path";

const CHECK = "✓";
const FAIL = "✗";
const INFO = "○";
const WARN = "!";

const checks = [];
let hardFailures = 0;

function add(symbol, label, detail, fatal = false) {
  checks.push({ symbol, label, detail });
  if (fatal && symbol === FAIL) hardFailures += 1;
}

function tryExec(cmd) {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return null;
  }
}

// 1. Node version
const major = Number(process.versions.node.split(".")[0]);
if (major >= 20) {
  add(CHECK, "Node", `v${process.versions.node}`);
} else {
  add(FAIL, "Node", `v${process.versions.node} (need ≥20 — install from https://nodejs.org)`, true);
}

// 2. Claude CLI
const claudeEnv = process.env.CLAUDE_CLI_PATH;
const candidates = [
  claudeEnv,
  join(homedir(), ".local/bin/claude"),
  "/usr/local/bin/claude",
  "/opt/homebrew/bin/claude",
  join(homedir(), ".npm-global/bin/claude"),
].filter(Boolean);

let claudePath = null;
const which = tryExec(platform() === "win32" ? "where claude" : "command -v claude");
if (which) claudePath = which.split("\n")[0];
if (!claudePath) {
  for (const c of candidates) {
    if (existsSync(c)) {
      claudePath = c;
      break;
    }
  }
}
if (claudePath) {
  add(CHECK, "Claude CLI", claudePath);
} else {
  add(FAIL, "Claude CLI", "not found — install from https://docs.anthropic.com/en/docs/claude-code", true);
}

// 3. Dependencies
if (existsSync("node_modules") && statSync("node_modules").isDirectory()) {
  add(CHECK, "Dependencies", "node_modules present");
} else {
  add(FAIL, "Dependencies", "node_modules missing — run `/start` or `npm install`", true);
}

// 4. Data files
const dataFiles = ["brand.json", "carousels.json", "templates.json", "staged-actions.json", "style-presets.json"];
const missingData = dataFiles.filter((f) => !existsSync(join("data", f)));
if (missingData.length === 0) {
  add(CHECK, "Data files", "all 5 seeded");
} else if (missingData.length === dataFiles.length) {
  add(FAIL, "Data files", "none seeded — run `/start` or `npm run setup`", true);
} else {
  add(WARN, "Data files", `${missingData.length} missing: ${missingData.join(", ")} — run /start`);
}

// 5. Slide imagery (optional)
let magnificKey = process.env.MAGNIFIC_API_KEY?.trim();
if (!magnificKey && existsSync(".env.local")) {
  const match = readFileSync(".env.local", "utf-8").match(
    /^\s*MAGNIFIC_API_KEY\s*=\s*(.+)$/m
  );
  if (match) magnificKey = match[1].trim();
}
if (magnificKey) {
  add(CHECK, "Slide imagery", "MAGNIFIC_API_KEY set (Seedream V5 Lite)");
} else {
  add(INFO, "Slide imagery", "off — set MAGNIFIC_API_KEY in .env.local to generate images");
}

// 6. Port 3100
let portStatus = "free";
let portFree = true;
if (platform() !== "win32") {
  const pid = tryExec("lsof -ti :3100");
  if (pid) {
    portStatus = `in use by PID ${pid.split("\n")[0]} — \`/stop\` to kill`;
    portFree = false;
  }
} else {
  // Best-effort on Windows; non-fatal
  const out = tryExec("netstat -ano -p tcp");
  if (out && /:3100\s+.+LISTENING/i.test(out)) {
    portStatus = "in use (run `netstat -ano | findstr :3100` for details)";
    portFree = false;
  }
}
add(portFree ? CHECK : INFO, "Port 3100", portStatus);

// Output
const labelWidth = Math.max(...checks.map((c) => c.label.length));
console.log("");
for (const { symbol, label, detail } of checks) {
  console.log(`  ${symbol}  ${label.padEnd(labelWidth)}   ${detail}`);
}
console.log("");

if (hardFailures > 0) {
  console.log(`  ${hardFailures} required check${hardFailures > 1 ? "s" : ""} failed.`);
  process.exit(1);
} else {
  process.exit(0);
}
