// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
import { readDataSafe, writeData } from "./data";
import { now } from "./utils";
import type { BrandConfig } from "@/types/brand";
import { DEFAULT_BRAND } from "@/types/brand";

const FILE = "brand.json";

export async function getBrand(): Promise<BrandConfig> {
  return readDataSafe<BrandConfig>(FILE, DEFAULT_BRAND);
}

export async function updateBrand(
  updates: Partial<Omit<BrandConfig, "createdAt" | "updatedAt">>
): Promise<BrandConfig> {
  const current = await getBrand();
  const updated: BrandConfig = {
    ...current,
    ...updates,
    colors: { ...current.colors, ...updates.colors },
    fonts: { ...current.fonts, ...updates.fonts },
    updatedAt: now(),
    createdAt: current.createdAt || now(),
  };
  await writeData(FILE, updated);
  return updated;
}

export function isBrandConfigured(brand: BrandConfig): boolean {
  return brand.name.trim().length > 0;
}
