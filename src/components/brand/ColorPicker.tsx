// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
"use client";

import { Input } from "@/components/ui/input";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={`${label} color`}
        />
        <div
          className="h-9 w-9 rounded-lg border border-border shadow-sm cursor-pointer"
          style={{ backgroundColor: value }}
        />
      </div>
      <div className="flex-1">
        <label className="text-xs font-medium text-muted-foreground">
          {label}
        </label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-xs font-mono mt-0.5"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
