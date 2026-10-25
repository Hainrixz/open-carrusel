// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
import { readDataSafe, writeData } from "./data";
import { generateId, now } from "./utils";
import type { StylePreset, StylePresetsData } from "@/types/style-preset";

const FILE = "style-presets.json";

async function load(): Promise<StylePresetsData> {
  return readDataSafe<StylePresetsData>(FILE, { presets: [] });
}

async function save(data: StylePresetsData): Promise<void> {
  await writeData(FILE, data);
}

export async function listPresets(): Promise<StylePreset[]> {
  const data = await load();
  return data.presets;
}

export async function getPreset(id: string): Promise<StylePreset | null> {
  const data = await load();
  return data.presets.find((p) => p.id === id) ?? null;
}

export async function createPreset(
  params: Omit<StylePreset, "id" | "createdAt">
): Promise<StylePreset> {
  const data = await load();
  const preset: StylePreset = {
    ...params,
    id: generateId(),
    createdAt: now(),
  };
  data.presets.push(preset);
  await save(data);
  return preset;
}

export async function deletePreset(id: string): Promise<boolean> {
  const data = await load();
  const idx = data.presets.findIndex((p) => p.id === id);
  if (idx === -1) return false;
  data.presets.splice(idx, 1);
  await save(data);
  return true;
}
