// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
"use client";

import type { AspectRatio } from "@/types/carousel";
import { cn } from "@/lib/utils";

interface AspectRatioSelectorProps {
  value: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
}

const RATIOS: { value: AspectRatio; label: string; icon: { w: number; h: number } }[] = [
  { value: "1:1", label: "Square", icon: { w: 16, h: 16 } },
  { value: "4:5", label: "Portrait", icon: { w: 16, h: 20 } },
  { value: "9:16", label: "Story", icon: { w: 12, h: 22 } },
];

export function AspectRatioSelector({
  value,
  onChange,
}: AspectRatioSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      {RATIOS.map((ratio) => (
        <button
          key={ratio.value}
          onClick={() => onChange(ratio.value)}
          className={cn(
            "oc-press flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs",
            value === ratio.value
              ? "bg-foreground text-background"
              : "hover:bg-muted text-muted-foreground"
          )}
          aria-label={`${ratio.label} (${ratio.value})`}
        >
          <div
            className={cn(
              "border-2 rounded-sm",
              value === ratio.value
                ? "border-background"
                : "border-muted-foreground"
            )}
            style={{ width: ratio.icon.w, height: ratio.icon.h }}
          />
          <span>{ratio.value}</span>
        </button>
      ))}
    </div>
  );
}
