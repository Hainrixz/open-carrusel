// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
"use client";

import { useCallback, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { BookOpen, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BrandRule } from "@/types/brand";

interface BrandRulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandName?: string;
}

export function BrandRulesDialog({
  open,
  onOpenChange,
  brandName,
}: BrandRulesDialogProps) {
  const [rules, setRules] = useState<BrandRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newRule, setNewRule] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/brand/rules`);
      const data = (await response.json()) as { rules?: BrandRule[] };
      setRules(data.rules ?? []);
    } catch {
      setError("Could not load the brand rulebook.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setNewRule("");
    setEditingId(null);
    setEditingText("");
    void loadRules();
  }, [open, loadRules]);

  const addRule = useCallback(async () => {
    const text = newRule.trim();
    if (!text || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/brand/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Save failed");
      }
      const rule = data as BrandRule;
      setRules((prev) =>
        prev.some((item) => item.id === rule.id) ? prev : [...prev, rule]
      );
      setNewRule("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [newRule, saving]);

  const saveEdit = useCallback(
    async (id: string) => {
      const text = editingText.trim();
      if (!text || saving) return;
      setSaving(true);
      setError(null);
      try {
        const response = await fetch(`/api/brand/rules/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error((data as { error?: string }).error || "Save failed");
        }
        const rule = data as BrandRule;
        setRules((prev) => prev.map((item) => (item.id === id ? rule : item)));
        setEditingId(null);
        setEditingText("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      } finally {
        setSaving(false);
      }
    },
    [editingText, saving]
  );

  const deleteRule = useCallback(async (id: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/brand/rules/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || "Delete failed"
        );
      }
      setRules((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          data-oc-overlay
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        />
        <Dialog.Content
          data-oc-dialog
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <Dialog.Title className="text-sm font-semibold">
                  Brand rulebook
                </Dialog.Title>
                <Dialog.Description className="mt-0.5 text-xs text-muted-foreground">
                  Permanent rules for {brandName || "this brand"}. The agent
                  reads them in every new session.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-2 border-b border-border px-6 py-3">
            <textarea
              value={newRule}
              onChange={(event) => setNewRule(event.target.value)}
              placeholder="e.g. Never use em dashes. Prefer short, direct sentences."
              maxLength={1000}
              rows={2}
              className="w-full resize-none rounded-lg bg-muted px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="New brand rule"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] text-muted-foreground">
                {newRule.length}/1000
              </span>
              <Button
                size="sm"
                onClick={() => void addRule()}
                disabled={!newRule.trim() || saving}
              >
                <Plus className="h-3.5 w-3.5" />
                Add rule
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-3">
            {loading && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Loading rules...
              </p>
            )}
            {!loading && rules.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No rules yet. Tick &quot;Save as brand rule&quot; in the chat,
                or add one above.
              </p>
            )}
            <ul className="space-y-2">
              {rules.map((rule, index) => (
                <li
                  key={rule.id}
                  className="rounded-lg border border-border bg-background px-3 py-2"
                >
                  {editingId === rule.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingText}
                        onChange={(event) => setEditingText(event.target.value)}
                        maxLength={1000}
                        rows={3}
                        className="w-full resize-none rounded-md bg-muted px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                        aria-label="Edit brand rule"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => void saveEdit(rule.id)}
                          disabled={!editingText.trim() || saving}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 w-4 shrink-0 text-[10px] font-medium text-muted-foreground">
                        {index + 1}.
                      </span>
                      <p className="flex-1 whitespace-pre-wrap text-xs leading-relaxed">
                        {rule.text}
                      </p>
                      <button
                        onClick={() => {
                          setEditingId(rule.id);
                          setEditingText(rule.text);
                          setError(null);
                        }}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Edit rule"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => void deleteRule(rule.id)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Delete rule"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <p className="border-t border-border px-6 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end border-t border-border px-6 py-3">
            <Dialog.Close asChild>
              <Button size="sm" variant="outline">
                Done
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
