// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
"use client";

import type { AspectRatio } from "@/types/carousel";
import { DIMENSIONS } from "@/types/carousel";

interface SafeZoneOverlayProps {
  aspectRatio: AspectRatio;
  visible: boolean;
}

export function SafeZoneOverlay({ aspectRatio, visible }: SafeZoneOverlayProps) {
  if (!visible) return null;

  const { width, height } = DIMENSIONS[aspectRatio];
  const isPortrait = height > width;

  // Grid crop zone: Instagram shows center square on profile grid
  const gridCropTop = isPortrait ? ((height - width) / 2 / height) * 100 : 0;
  const gridCropBottom = isPortrait ? ((height - width) / 2 / height) * 100 : 0;

  // Bottom UI overlay: ~14% of height (like/save buttons area)
  const bottomUiPercent = 14;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Grid crop zone — top */}
      {isPortrait && (
        <div
          className="absolute left-0 right-0 top-0 bg-red-500/10 border-b border-dashed border-red-400/50"
          style={{ height: `${gridCropTop}%` }}
        >
          <span className="absolute bottom-1 left-2 text-[8px] text-red-500/70 font-medium">
            Grid crop
          </span>
        </div>
      )}

      {/* Grid crop zone — bottom */}
      {isPortrait && (
        <div
          className="absolute left-0 right-0 bottom-0 bg-red-500/10 border-t border-dashed border-red-400/50"
          style={{ height: `${gridCropBottom}%` }}
        >
          <span className="absolute top-1 left-2 text-[8px] text-red-500/70 font-medium">
            Grid crop
          </span>
        </div>
      )}

      {/* Bottom UI overlay zone */}
      <div
        className="absolute left-0 right-0 bottom-0 bg-blue-500/8 border-t border-dashed border-blue-400/40"
        style={{ height: `${bottomUiPercent}%` }}
      >
        <span className="absolute top-1 right-2 text-[8px] text-blue-500/60 font-medium">
          UI overlay
        </span>
      </div>

      {/* Safe zone border — center 80% */}
      <div
        className="absolute border border-dashed border-green-400/40 rounded-sm"
        style={{
          left: "10%",
          right: "10%",
          top: "10%",
          bottom: `${Math.max(10, bottomUiPercent + 2)}%`,
        }}
      >
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] text-green-500/70 font-medium bg-white/80 px-1 rounded">
          Safe zone
        </span>
      </div>
    </div>
  );
}
