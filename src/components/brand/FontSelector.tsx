// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
"use client";

import { useState, useEffect } from "react";

interface Font {
  name: string;
  category: string;
}

interface FontSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function FontSelector({ label, value, onChange }: FontSelectorProps) {
  const [fonts, setFonts] = useState<Font[]>([]);

  useEffect(() => {
    fetch("/api/fonts")
      .then((r) => r.json())
      .then((data) => setFonts(data.fonts || []))
      .catch(() => {});
  }, []);

  // The preview only sets font-family; the browser has to be told to load the
  // Google Font first, otherwise it silently falls back to sans-serif.
  useEffect(() => {
    if (!value) return;
    const id = `oc-font-${value.replace(/\s+/g, "-")}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(value)}:wght@400;700&display=swap`;
    document.head.appendChild(link);
  }, [value]);

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-10 rounded-lg border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {fonts.map((font) => (
          <option key={font.name} value={font.name}>
            {font.name} ({font.category})
          </option>
        ))}
      </select>
      <p
        className="mt-2 text-sm"
        style={{ fontFamily: `'${value}', sans-serif` }}
      >
        The quick brown fox jumps over the lazy dog
      </p>
    </div>
  );
}
