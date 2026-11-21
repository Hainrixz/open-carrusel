// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
"use client";

import { useState, useRef } from "react";
import { Bookmark, Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (
    message: string,
    options?: { rememberBrandRule?: boolean }
  ) => void;
  isStreaming: boolean;
  disabled?: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  onStop?: () => void;
}

const SUGGESTIONS = [
  "Create a 5-slide carousel about...",
  "Make the design more minimal",
  "Change the accent color to blue",
  "Add a call-to-action slide",
  "Make the headings bigger",
];

export function ChatInput({ onSend, isStreaming, disabled, textareaRef: externalRef, onStop }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [rememberBrandRule, setRememberBrandRule] = useState(false);
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef || internalRef;

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed, { rememberBrandRule });
    setValue("");
    setRememberBrandRule(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  };

  return (
    <div className="border-t border-border p-3">
      {value.length === 0 && !isStreaming && !rememberBrandRule && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {SUGGESTIONS.slice(0, 3).map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setValue(suggestion)}
              className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      <label className="flex items-center gap-2 mb-2 text-[11px] text-muted-foreground cursor-pointer select-none">
        <input
          type="checkbox"
          checked={rememberBrandRule}
          onChange={(e) => setRememberBrandRule(e.target.checked)}
          disabled={isStreaming || disabled}
          className="h-3.5 w-3.5 rounded border-border accent-accent"
        />
        <span>Save as brand rule</span>
        <span className="text-[10px] text-muted-foreground/70">
          applies to every carousel
        </span>
      </label>
      {rememberBrandRule && (
        <p className="text-[10px] text-muted-foreground mb-2">
          This message becomes a permanent rule for the brand. It is stored
          before the agent answers.
        </p>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder={
            isStreaming
              ? "AI is working..."
              : rememberBrandRule
                ? "Describe a permanent brand rule..."
                : "Describe your carousel..."
          }
          disabled={isStreaming || disabled}
          rows={1}
          className="flex-1 resize-none bg-muted rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          aria-label="Chat message input"
        />
        {isStreaming ? (
          <Button
            size="icon"
            variant="destructive"
            onClick={onStop}
            aria-label="Stop generating"
          >
            <Square className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            aria-label={
              rememberBrandRule ? "Save brand rule" : "Send message"
            }
          >
            {rememberBrandRule ? (
              <Bookmark className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
