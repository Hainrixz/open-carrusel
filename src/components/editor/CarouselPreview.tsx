// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideRenderer } from "./SlideRenderer";
import { SafeZoneOverlay } from "./SafeZoneOverlay";
import type { Slide, AspectRatio } from "@/types/carousel";

interface CarouselPreviewProps {
  slides: Slide[];
  aspectRatio: AspectRatio;
  activeIndex: number;
  onActiveChange: (index: number) => void;
  showSafeZones?: boolean;
}

export function CarouselPreview({
  slides,
  aspectRatio,
  activeIndex,
  onActiveChange,
  showSafeZones = false,
}: CarouselPreviewProps) {
  const slide = slides[activeIndex];
  const prevIndexRef = useRef(activeIndex);
  const direction = activeIndex >= prevIndexRef.current ? 12 : -12;
  useEffect(() => {
    prevIndexRef.current = activeIndex;
  }, [activeIndex]);

  if (!slide) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f0f0f0]">
        <div className="text-center text-muted-foreground p-8">
          <div className="w-16 h-20 border-2 border-dashed border-muted-foreground/30 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl opacity-30">+</span>
          </div>
          <p className="text-sm font-medium">No slides yet</p>
          <p className="text-xs mt-1 max-w-[200px]">
            Use the AI assistant to create your first carousel slide
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#f0f0f0]">
      {/* Preview area with padding for arrows */}
      <div className="flex-1 relative min-h-0 p-8 px-14">
        {/* Left arrow */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onActiveChange(activeIndex - 1)}
          disabled={activeIndex <= 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-sm hover:bg-white h-9 w-9"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Slide fills the padded inner area */}
        <div
          key={slide.id}
          className="oc-slide-in relative w-full h-full"
          style={{ "--oc-slide-from": `${direction}px` } as CSSProperties}
        >
          <SlideRenderer
            html={slide.html}
            aspectRatio={aspectRatio}
            style={{ width: "100%", height: "100%" }}
          />
          <SafeZoneOverlay aspectRatio={aspectRatio} visible={showSafeZones} />
        </div>

        {/* Right arrow */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onActiveChange(activeIndex + 1)}
          disabled={activeIndex >= slides.length - 1}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-sm hover:bg-white h-9 w-9"
          aria-label="Next slide"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Slide counter dots */}
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-3 shrink-0">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => onActiveChange(i)}
              className={`h-2 rounded-full transition-[width,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                i === activeIndex
                  ? "w-6 bg-accent"
                  : "w-2 bg-foreground/20 hover:bg-foreground/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-2">
            {activeIndex + 1}/{slides.length}
          </span>
        </div>
      )}
    </div>
  );
}
