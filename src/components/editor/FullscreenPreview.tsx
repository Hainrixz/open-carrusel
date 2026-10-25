// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
"use client";

import { useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideRenderer } from "./SlideRenderer";
import type { Slide, AspectRatio } from "@/types/carousel";

interface FullscreenPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slides: Slide[];
  aspectRatio: AspectRatio;
  activeIndex: number;
  onActiveChange: (index: number) => void;
}

export function FullscreenPreview({
  open,
  onOpenChange,
  slides,
  aspectRatio,
  activeIndex,
  onActiveChange,
}: FullscreenPreviewProps) {
  const slide = slides[activeIndex];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && activeIndex > 0) {
        onActiveChange(activeIndex - 1);
      } else if (e.key === "ArrowRight" && activeIndex < slides.length - 1) {
        onActiveChange(activeIndex + 1);
      }
    },
    [activeIndex, slides.length, onActiveChange]
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay data-oc-overlay className="fixed inset-0 z-50 bg-black/90" />
        <Dialog.Content data-oc-fade-scale className="fixed inset-0 z-50 flex items-center justify-center p-8">
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
              aria-label="Close fullscreen"
            >
              <X className="h-5 w-5" />
            </button>
          </Dialog.Close>

          {/* Prev */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onActiveChange(activeIndex - 1)}
            disabled={activeIndex <= 0}
            className="absolute left-4 z-10 text-white bg-white/10 hover:bg-white/20 disabled:opacity-30 h-12 w-12"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          {/* Slide */}
          {slide && (
            <SlideRenderer
              html={slide.html}
              aspectRatio={aspectRatio}
              style={{ width: "100%", height: "100%", maxWidth: 800 }}
            />
          )}

          {/* Next */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onActiveChange(activeIndex + 1)}
            disabled={activeIndex >= slides.length - 1}
            className="absolute right-4 z-10 text-white bg-white/10 hover:bg-white/20 disabled:opacity-30 h-12 w-12"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          {/* Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => onActiveChange(i)}
                className={`h-2 rounded-full transition-all ${
                  i === activeIndex
                    ? "w-8 bg-white"
                    : "w-2 bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
            <span className="text-white/60 text-xs ml-2">
              {activeIndex + 1}/{slides.length}
            </span>
          </div>

          <Dialog.Title className="sr-only">Fullscreen Preview</Dialog.Title>
          <Dialog.Description className="sr-only">
            Viewing slide {activeIndex + 1} of {slides.length}
          </Dialog.Description>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
