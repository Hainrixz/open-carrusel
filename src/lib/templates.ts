// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
import { readDataSafe, writeData } from "./data";
import { generateId, now } from "./utils";
import type { Template, TemplatesData } from "@/types/template";
import type { Carousel } from "@/types/carousel";

const FILE = "templates.json";

async function load(): Promise<TemplatesData> {
  return readDataSafe<TemplatesData>(FILE, { templates: [] });
}

async function save(data: TemplatesData): Promise<void> {
  await writeData(FILE, data);
}

export async function listTemplates(): Promise<Template[]> {
  const data = await load();
  return data.templates;
}

export async function getTemplate(id: string): Promise<Template | null> {
  const data = await load();
  return data.templates.find((t) => t.id === id) ?? null;
}

export async function saveAsTemplate(
  carousel: Carousel,
  name?: string,
  description?: string
): Promise<Template> {
  const data = await load();
  const template: Template = {
    id: generateId(),
    name: name || carousel.name,
    description: description || `Template from ${carousel.name}`,
    aspectRatio: carousel.aspectRatio,
    slides: carousel.slides.map(({ id, html, order, notes }) => ({
      id,
      html,
      order,
      notes,
    })),
    tags: carousel.tags,
    createdAt: now(),
  };
  data.templates.push(template);
  await save(data);
  return template;
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const data = await load();
  const idx = data.templates.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  data.templates.splice(idx, 1);
  await save(data);
  return true;
}
