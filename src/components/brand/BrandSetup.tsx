// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronRight, ChevronLeft, Check, Palette, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "./ColorPicker";
import { FontSelector } from "./FontSelector";
import { LogoUpload } from "./LogoUpload";
import type { BrandConfig } from "@/types/brand";
import { DEFAULT_BRAND } from "@/types/brand";

interface BrandSetupProps {
  open: boolean;
  onComplete: () => void;
  initialBrand?: BrandConfig;
}

const STYLE_OPTIONS = [
  "minimal",
  "bold",
  "playful",
  "corporate",
  "luxury",
  "vintage",
  "modern",
  "elegant",
  "creative",
  "professional",
];

const STEPS = ["Brand Name", "Colors", "Fonts", "Logo", "Style"];

export function BrandSetup({ open, onComplete, initialBrand }: BrandSetupProps) {
  const [step, setStep] = useState(0);
  const [brand, setBrand] = useState<BrandConfig>(
    initialBrand || DEFAULT_BRAND
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialBrand) setBrand(initialBrand);
  }, [initialBrand]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await fetch("/api/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brand),
      });
      onComplete();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }, [brand, onComplete]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onComplete();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onComplete]);

  if (!open) return null;

  return (
    <div
      className="oc-fade fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onComplete(); }}
    >
      <div className="oc-enter-pop bg-surface rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden relative">
        {/* Close button */}
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Palette className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Set Up Your Brand</h2>
              <p className="text-xs text-muted-foreground">
                Step {step + 1} of {STEPS.length}: {STEPS[step]}
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="flex gap-1 mt-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-accent" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 min-h-[240px]">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  What&apos;s your brand name?
                </label>
                <Input
                  value={brand.name}
                  onChange={(e) =>
                    setBrand({ ...brand, name: e.target.value })
                  }
                  placeholder="My Brand"
                  className="mt-2 text-lg h-12"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This helps the AI maintain your brand identity across all
                carousels.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <ColorPicker
                label="Primary"
                value={brand.colors.primary}
                onChange={(v) =>
                  setBrand({
                    ...brand,
                    colors: { ...brand.colors, primary: v },
                  })
                }
              />
              <ColorPicker
                label="Secondary"
                value={brand.colors.secondary}
                onChange={(v) =>
                  setBrand({
                    ...brand,
                    colors: { ...brand.colors, secondary: v },
                  })
                }
              />
              <ColorPicker
                label="Accent"
                value={brand.colors.accent}
                onChange={(v) =>
                  setBrand({
                    ...brand,
                    colors: { ...brand.colors, accent: v },
                  })
                }
              />
              <ColorPicker
                label="Background"
                value={brand.colors.background}
                onChange={(v) =>
                  setBrand({
                    ...brand,
                    colors: { ...brand.colors, background: v },
                  })
                }
              />
              <ColorPicker
                label="Surface"
                value={brand.colors.surface}
                onChange={(v) =>
                  setBrand({
                    ...brand,
                    colors: { ...brand.colors, surface: v },
                  })
                }
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <FontSelector
                label="Heading Font"
                value={brand.fonts.heading}
                onChange={(v) =>
                  setBrand({
                    ...brand,
                    fonts: { ...brand.fonts, heading: v },
                  })
                }
              />
              <FontSelector
                label="Body Font"
                value={brand.fonts.body}
                onChange={(v) =>
                  setBrand({
                    ...brand,
                    fonts: { ...brand.fonts, body: v },
                  })
                }
              />
            </div>
          )}

          {step === 3 && (
            <LogoUpload
              value={brand.logoPath}
              onChange={(path) => setBrand({ ...brand, logoPath: path })}
            />
          )}

          {step === 4 && (
            <div>
              <label className="text-sm font-medium">
                Choose your brand style
              </label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Select keywords that describe your visual identity
              </p>
              <div className="flex flex-wrap gap-2">
                {STYLE_OPTIONS.map((keyword) => (
                  <button
                    key={keyword}
                    onClick={() => {
                      const keywords = brand.styleKeywords.includes(keyword)
                        ? brand.styleKeywords.filter((k) => k !== keyword)
                        : [...brand.styleKeywords, keyword];
                      setBrand({ ...brand, styleKeywords: keywords });
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      brand.styleKeywords.includes(keyword)
                        ? "bg-accent text-accent-foreground border-accent"
                        : "bg-transparent text-foreground border-border hover:border-muted-foreground"
                    }`}
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 0 && !brand.name.trim()}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="accent"
              onClick={handleSave}
              disabled={saving || !brand.name.trim()}
            >
              {saving ? (
                "Saving..."
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Complete Setup
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
