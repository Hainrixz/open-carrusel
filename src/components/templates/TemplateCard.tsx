// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
"use client";

import { Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SlideRenderer } from "@/components/editor/SlideRenderer";
import type { Template } from "@/types/template";

interface TemplateCardProps {
  template: Template;
  onUse: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TemplateCard({ template, onUse, onDelete }: TemplateCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 group hover:border-accent/50 hover:shadow-md hover:-translate-y-0.5 transition-[translate,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]">
      <div className="h-28 rounded-lg bg-muted mb-3 overflow-hidden">
        {template.slides.length > 0 ? (
          <SlideRenderer
            html={template.slides[0].html}
            aspectRatio={template.aspectRatio}
            className="w-full h-full"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground/30 text-xs">
            Empty
          </div>
        )}
      </div>
      <h3 className="font-semibold text-sm truncate">{template.name}</h3>
      <p className="text-xs text-muted-foreground mt-0.5 truncate">
        {template.slides.length} slide{template.slides.length !== 1 ? "s" : ""} &middot; {template.aspectRatio}
      </p>
      <div className="flex items-center gap-2 mt-3">
        <Button
          variant="accent"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => onUse(template.id)}
        >
          Use Template
          <ArrowRight className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onDelete(template.id)}
          aria-label="Delete template"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
