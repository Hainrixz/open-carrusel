// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
"use client";

import { useState } from "react";
import { Download, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  carouselId: string;
  slideCount: number;
}

export function ExportButton({ carouselId, slideCount }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    if (exporting || slideCount === 0) return;
    setExporting(true);
    setDone(false);
    setProgress({ current: 0, total: slideCount });

    try {
      const response = await fetch(`/api/carousels/${carouselId}/export`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Check if it's SSE (progress) or direct blob (ZIP)
      const contentType = response.headers.get("Content-Type");
      if (contentType?.includes("text/event-stream")) {
        // SSE progress mode
        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.current && data.total) {
                  setProgress({ current: data.current, total: data.total });
                }
                if (data.downloadUrl) {
                  // Trigger download
                  const a = document.createElement("a");
                  a.href = data.downloadUrl;
                  a.download = `carousel-${carouselId}.zip`;
                  a.click();
                  setDone(true);
                }
              } catch {
                // skip
              }
            }
          }
        }
      } else {
        // Direct ZIP download
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `carousel-${carouselId}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        setDone(true);
      }
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExporting(false);
      setTimeout(() => setDone(false), 3000);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={exporting || slideCount === 0}
      variant="accent"
      size="sm"
    >
      <span
        key={exporting ? "exporting" : done ? "done" : "idle"}
        className="oc-enter-pop inline-flex items-center gap-2"
      >
        {exporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>
              {progress.current}/{progress.total}
            </span>
          </>
        ) : done ? (
          <>
            <Check className="h-4 w-4" />
            <span>Downloaded!</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span>Export PNG</span>
          </>
        )}
      </span>
    </Button>
  );
}
