// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Settings, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  editable?: boolean;
  onTitleChange?: (newTitle: string) => void;
  onSettingsClick?: () => void;
}

export function TopBar({
  title,
  showBack,
  editable,
  onTitleChange,
  onSettingsClick,
}: TopBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = () => {
    setEditValue(title || "");
    setIsEditing(true);
  };

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) {
      onTitleChange?.(trimmed);
    } else {
      setEditValue(title || "");
    }
    setIsEditing(false);
  };

  return (
    <header className="h-14 border-b border-border bg-surface flex items-center px-4 gap-3 shrink-0">
      {showBack && (
        <Link href="/">
          <Button variant="ghost" size="icon" aria-label="Back to dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      )}
      <div className="flex items-center gap-2 min-w-0">
        <Layers className="h-5 w-5 text-accent shrink-0" />
        {isEditing && editable ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") {
                setEditValue(title || "");
                setIsEditing(false);
              }
            }}
            className="font-semibold text-sm bg-transparent border-b-2 border-accent outline-none py-0.5 min-w-[120px]"
          />
        ) : (
          <span
            className={`font-semibold text-sm truncate ${editable ? "cursor-pointer hover:text-accent transition-colors" : ""}`}
            onClick={() => editable && startEditing()}
            title={editable ? "Click to rename" : undefined}
          >
            {title || "Open Carrusel"}
          </span>
        )}
      </div>
      <div className="flex-1" />
      {onSettingsClick && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onSettingsClick}
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      )}
    </header>
  );
}
