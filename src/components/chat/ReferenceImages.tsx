// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
"use client";

import { useState, useCallback } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReferenceImage } from "@/types/carousel";

interface ReferenceImagesProps {
  carouselId: string;
  images: ReferenceImage[];
  onImagesChange: () => void;
}

export function ReferenceImages({
  carouselId,
  images,
  onImagesChange,
}: ReferenceImagesProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        // Upload the file
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) return;
        const uploadData = await uploadRes.json();

        // Register as reference image
        await fetch(`/api/carousels/${carouselId}/references`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: uploadData.url,
            name: file.name,
          }),
        });

        onImagesChange();
      } catch {
        // ignore
      } finally {
        setUploading(false);
      }
    },
    [carouselId, onImagesChange]
  );

  const handleRemove = useCallback(
    async (imageId: string) => {
      await fetch(
        `/api/carousels/${carouselId}/references?imageId=${imageId}`,
        { method: "DELETE" }
      );
      onImagesChange();
    },
    [carouselId, onImagesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) handleUpload(file);
    },
    [handleUpload]
  );

  const handleClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleUpload(file);
    };
    input.click();
  }, [handleUpload]);

  return (
    <div className="border-b border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          Reference Images
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClick}
          disabled={uploading}
          className="h-6 text-xs gap-1 px-2"
        >
          <ImagePlus className="h-3 w-3" />
          {uploading ? "Uploading..." : "Add"}
        </Button>
      </div>

      {/* Images grid or drop zone */}
      {images.length === 0 ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={handleClick}
          className="mx-4 mb-3 border border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-muted-foreground/50 hover:bg-muted/30 transition-colors"
        >
          <ImagePlus className="h-4 w-4 mx-auto text-muted-foreground/50 mb-1" />
          <p className="text-[10px] text-muted-foreground">
            Drop reference images here
          </p>
          <p className="text-[9px] text-muted-foreground/70">
            The AI will study these to match your style
          </p>
        </div>
      ) : (
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          {images.map((img) => (
            <div key={img.id} className="oc-enter-pop relative group shrink-0">
              <button
                onClick={() => setPreviewUrl(previewUrl === img.url ? null : img.url)}
                className="block w-14 h-14 rounded-lg overflow-hidden border border-border hover:border-accent transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
              </button>
              {/* Remove button */}
              <button
                onClick={() => handleRemove(img.id)}
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove ${img.name}`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
          {/* Add more button */}
          <button
            onClick={handleClick}
            className="shrink-0 w-14 h-14 rounded-lg border border-dashed border-border flex items-center justify-center hover:border-muted-foreground/50 transition-colors"
          >
            <ImagePlus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Preview modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-8"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-2xl max-h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Reference preview"
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-white text-foreground flex items-center justify-center shadow-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
