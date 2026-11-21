// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
import { Mutex } from "async-mutex";
import { readDataSafe, writeData } from "./data";
import { generateId, now } from "./utils";
import type { BrandConfig, BrandRule } from "@/types/brand";
import { DEFAULT_BRAND } from "@/types/brand";

const FILE = "brand.json";
const brandMutex = new Mutex();

function normalizeBrand(raw: Partial<BrandConfig> | null): BrandConfig {
  return {
    ...DEFAULT_BRAND,
    ...raw,
    colors: { ...DEFAULT_BRAND.colors, ...raw?.colors },
    fonts: { ...DEFAULT_BRAND.fonts, ...raw?.fonts },
    customFonts: raw?.customFonts ?? [],
    styleKeywords: raw?.styleKeywords ?? [],
    rules: raw?.rules ?? [],
  };
}

export async function getBrand(): Promise<BrandConfig> {
  const raw = await readDataSafe<Partial<BrandConfig>>(FILE, DEFAULT_BRAND);
  return normalizeBrand(raw);
}

// Read-modify-write under a mutex so concurrent rule edits cannot overwrite each other.
async function mutateBrand<T>(
  mutator: (current: BrandConfig) => { brand: BrandConfig; result: T }
): Promise<T> {
  return brandMutex.runExclusive(async () => {
    const current = await getBrand();
    const outcome = mutator(current);
    if (outcome.brand !== current) {
      await writeData(FILE, outcome.brand);
    }
    return outcome.result;
  });
}

export async function updateBrand(
  updates: Partial<Omit<BrandConfig, "createdAt" | "updatedAt">>
): Promise<BrandConfig> {
  return mutateBrand((current) => {
    const updated: BrandConfig = {
      ...current,
      ...updates,
      colors: { ...current.colors, ...updates.colors },
      fonts: { ...current.fonts, ...updates.fonts },
      rules: updates.rules ?? current.rules,
      updatedAt: now(),
      createdAt: current.createdAt || now(),
    };
    return { brand: updated, result: updated };
  });
}

export async function addBrandRule(text: string): Promise<BrandRule> {
  const normalized = text.trim();
  return mutateBrand((current) => {
    const existing = current.rules.find(
      (rule) => rule.text.toLowerCase() === normalized.toLowerCase()
    );
    if (existing) {
      return { brand: current, result: existing };
    }

    const rule: BrandRule = {
      id: generateId(),
      text: normalized,
      createdAt: now(),
    };
    const brand: BrandConfig = {
      ...current,
      rules: [...current.rules, rule],
      updatedAt: now(),
      createdAt: current.createdAt || now(),
    };
    return { brand, result: rule };
  });
}

export async function updateBrandRule(
  id: string,
  text: string
): Promise<BrandRule | null> {
  return mutateBrand((current) => {
    const existing = current.rules.find((rule) => rule.id === id);
    if (!existing) {
      return { brand: current, result: null };
    }
    const rule: BrandRule = { ...existing, text: text.trim() };
    const brand: BrandConfig = {
      ...current,
      rules: current.rules.map((item) => (item.id === id ? rule : item)),
      updatedAt: now(),
    };
    return { brand, result: rule };
  });
}

export async function removeBrandRule(id: string): Promise<boolean> {
  return mutateBrand((current) => {
    const rules = current.rules.filter((rule) => rule.id !== id);
    if (rules.length === current.rules.length) {
      return { brand: current, result: false };
    }
    const brand: BrandConfig = {
      ...current,
      rules,
      updatedAt: now(),
    };
    return { brand, result: true };
  });
}

export function isBrandConfigured(brand: BrandConfig): boolean {
  return brand.name.trim().length > 0;
}
