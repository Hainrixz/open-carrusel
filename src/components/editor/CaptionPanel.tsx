// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp, Hash, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CaptionPanelProps {
  caption?: string;
  hashtags?: string[];
}

export function CaptionPanel({ caption, hashtags }: CaptionPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);

  const hasContent = (caption && caption.trim()) || (hashtags && hashtags.length > 0);

  if (!hasContent) return null;

  const handleCopy = async (text: string, type: "caption" | "hashtags") => {
    await navigator.clipboard.writeText(text);
    if (type === "caption") {
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    } else {
      setCopiedHashtags(true);
      setTimeout(() => setCopiedHashtags(false), 2000);
    }
  };

  return (
    <div className="border-t border-border bg-surface">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <MessageSquare className="h-3 w-3" />
          Caption & Hashtags
        </span>
        {expanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronUp className="h-3 w-3" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-3">
          {caption && caption.trim() && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-muted-foreground">
                  Caption
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[10px] gap-1 px-1.5"
                  onClick={() => handleCopy(caption, "caption")}
                >
                  {copiedCaption ? (
                    <Check className="h-2.5 w-2.5 text-green-500" />
                  ) : (
                    <Copy className="h-2.5 w-2.5" />
                  )}
                  {copiedCaption ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="text-xs text-foreground bg-muted rounded-md p-2 whitespace-pre-wrap">
                {caption}
              </p>
            </div>
          )}

          {hashtags && hashtags.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                  <Hash className="h-2.5 w-2.5" />
                  Hashtags ({hashtags.length})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-[10px] gap-1 px-1.5"
                  onClick={() =>
                    handleCopy(hashtags.map((h) => `#${h}`).join(" "), "hashtags")
                  }
                >
                  {copiedHashtags ? (
                    <Check className="h-2.5 w-2.5 text-green-500" />
                  ) : (
                    <Copy className="h-2.5 w-2.5" />
                  )}
                  {copiedHashtags ? "Copied" : "Copy All"}
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] bg-accent/10 text-accent rounded-full px-2 py-0.5"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
