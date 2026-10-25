// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
"use client";

import { useState, useCallback } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogoUploadProps {
  value: string | null;
  onChange: (path: string | null) => void;
}

export function LogoUpload({ value, onChange }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          onChange(data.url);
        }
      } catch {
        // ignore
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">Logo</label>
      {value ? (
        <div className="mt-1 flex items-center gap-3">
          <div className="h-16 w-16 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Brand logo"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
          >
            <X className="h-3 w-3 mr-1" />
            Remove
          </Button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/png,image/jpeg,image/webp";
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleUpload(file);
            };
            input.click();
          }}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-5 w-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-muted-foreground">
                Uploading...
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <span className="text-xs font-medium">
                  Drop your logo here
                </span>
                <span className="text-xs text-muted-foreground block">
                  PNG, JPG, or WebP (max 10MB)
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
