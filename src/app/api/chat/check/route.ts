// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
import { NextResponse } from "next/server";
import { isClaudeAvailable } from "@/lib/claude-path";

export async function GET() {
  return NextResponse.json({ available: isClaudeAvailable() });
}
