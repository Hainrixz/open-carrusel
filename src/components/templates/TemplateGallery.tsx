// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { TemplateCard } from "./TemplateCard";
import type { Template } from "@/types/template";

export function TemplateGallery() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data.templates || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUse = useCallback(
    async (templateId: string) => {
      const res = await fetch(`/api/templates/${templateId}/use`, {
        method: "POST",
      });
      if (res.ok) {
        const carousel = await res.json();
        router.push(`/carousel/${carousel.id}`);
      }
    },
    [router]
  );

  const handleDelete = useCallback(async (templateId: string) => {
    const res = await fetch(`/api/templates/${templateId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    }
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <Bookmark className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No templates saved yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Save a carousel as a template to reuse it later
        </p>
      </div>
    );
  }

  return (
    <div className="oc-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onUse={handleUse}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
