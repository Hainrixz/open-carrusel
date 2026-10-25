// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
"use client";

import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  return (
    <div
      className={cn(
        "oc-enter flex gap-3 px-4 py-3",
        role === "user" ? "bg-transparent" : "bg-muted/50"
      )}
    >
      <div
        className={cn(
          "h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
          role === "user"
            ? "bg-foreground text-background"
            : "bg-accent text-accent-foreground"
        )}
      >
        {role === "user" ? (
          <User className="h-3.5 w-3.5" />
        ) : (
          <Bot className="h-3.5 w-3.5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-muted-foreground mb-1">
          {role === "user" ? "You" : "Carrusel AI"}
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {content}
          {isStreaming && (
            <span className="oc-caret inline-block w-1.5 h-4 bg-accent ml-0.5 align-text-bottom" />
          )}
        </div>
      </div>
    </div>
  );
}
