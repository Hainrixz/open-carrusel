// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "destructive" | "default";
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay data-oc-overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content data-oc-dialog className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface border border-border p-6 shadow-2xl">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                variant === "destructive"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-accent/10 text-accent"
              )}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-sm font-semibold">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted-foreground mt-1">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Dialog.Close asChild>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              variant={variant === "destructive" ? "destructive" : "accent"}
              size="sm"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
