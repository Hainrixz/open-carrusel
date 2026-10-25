// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
import { readDataSafe, writeData } from "./data";
import { generateId, now } from "./utils";
import type { Carousel, CarouselsData, Slide, AspectRatio, ReferenceImage } from "@/types/carousel";
import { MAX_SLIDES, MAX_VERSIONS } from "@/types/carousel";

const FILE = "carousels.json";

async function load(): Promise<CarouselsData> {
  return readDataSafe<CarouselsData>(FILE, { carousels: [] });
}

async function save(data: CarouselsData): Promise<void> {
  await writeData(FILE, data);
}

export async function listCarousels(): Promise<Carousel[]> {
  const data = await load();
  return data.carousels.filter((c) => !c.isTemplate);
}

export async function getCarousel(id: string): Promise<Carousel | null> {
  const data = await load();
  return data.carousels.find((c) => c.id === id) ?? null;
}

export async function createCarousel(
  name: string,
  aspectRatio: AspectRatio
): Promise<Carousel> {
  const data = await load();
  const carousel: Carousel = {
    id: generateId(),
    name,
    aspectRatio,
    slides: [],
    referenceImages: [],
    chatSessionId: null,
    isTemplate: false,
    tags: [],
    createdAt: now(),
    updatedAt: now(),
  };
  data.carousels.push(carousel);
  await save(data);
  return carousel;
}

export async function updateCarousel(
  id: string,
  updates: Partial<Pick<Carousel, "name" | "aspectRatio" | "tags" | "chatSessionId" | "caption" | "hashtags">>
): Promise<Carousel | null> {
  const data = await load();
  const idx = data.carousels.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  Object.assign(data.carousels[idx], updates, { updatedAt: now() });
  await save(data);
  return data.carousels[idx];
}

export async function duplicateCarousel(id: string): Promise<Carousel | null> {
  const data = await load();
  const source = data.carousels.find((c) => c.id === id);
  if (!source) return null;

  const duplicate: Carousel = {
    ...source,
    id: generateId(),
    name: `${source.name} (copy)`,
    slides: source.slides.map((s) => ({
      ...s,
      id: generateId(),
      previousVersions: [],
    })),
    referenceImages: [...(source.referenceImages || [])],
    chatSessionId: null,
    isTemplate: false,
    createdAt: now(),
    updatedAt: now(),
  };

  data.carousels.push(duplicate);
  await save(data);
  return duplicate;
}

export async function deleteCarousel(id: string): Promise<boolean> {
  const data = await load();
  const idx = data.carousels.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  data.carousels.splice(idx, 1);
  await save(data);
  return true;
}

// --- Slide operations ---

export async function addSlide(
  carouselId: string,
  html: string,
  notes = ""
): Promise<Slide | null> {
  const data = await load();
  const carousel = data.carousels.find((c) => c.id === carouselId);
  if (!carousel) return null;
  if (carousel.slides.length >= MAX_SLIDES) return null;

  const slide: Slide = {
    id: generateId(),
    html,
    previousVersions: [],
    order: carousel.slides.length,
    notes,
  };
  carousel.slides.push(slide);
  carousel.updatedAt = now();
  await save(data);
  return slide;
}

export async function updateSlide(
  carouselId: string,
  slideId: string,
  updates: Partial<Pick<Slide, "html" | "notes">>
): Promise<Slide | null> {
  const data = await load();
  const carousel = data.carousels.find((c) => c.id === carouselId);
  if (!carousel) return null;
  const slide = carousel.slides.find((s) => s.id === slideId);
  if (!slide) return null;

  // Save current HTML to version history before overwriting
  if (updates.html && updates.html !== slide.html) {
    slide.previousVersions.push(slide.html);
    if (slide.previousVersions.length > MAX_VERSIONS) {
      slide.previousVersions.shift();
    }
  }

  Object.assign(slide, updates);
  carousel.updatedAt = now();
  await save(data);
  return slide;
}

export async function deleteSlide(
  carouselId: string,
  slideId: string
): Promise<boolean> {
  const data = await load();
  const carousel = data.carousels.find((c) => c.id === carouselId);
  if (!carousel) return false;
  const idx = carousel.slides.findIndex((s) => s.id === slideId);
  if (idx === -1) return false;

  carousel.slides.splice(idx, 1);
  // Re-order remaining slides
  carousel.slides.forEach((s, i) => {
    s.order = i;
  });
  carousel.updatedAt = now();
  await save(data);
  return true;
}

export async function reorderSlides(
  carouselId: string,
  slideIds: string[]
): Promise<boolean> {
  const data = await load();
  const carousel = data.carousels.find((c) => c.id === carouselId);
  if (!carousel) return false;

  const slideMap = new Map(carousel.slides.map((s) => [s.id, s]));
  const reordered: Slide[] = [];
  for (const id of slideIds) {
    const slide = slideMap.get(id);
    if (!slide) return false;
    slide.order = reordered.length;
    reordered.push(slide);
  }
  carousel.slides = reordered;
  carousel.updatedAt = now();
  await save(data);
  return true;
}

export async function undoSlide(
  carouselId: string,
  slideId: string
): Promise<Slide | null> {
  const data = await load();
  const carousel = data.carousels.find((c) => c.id === carouselId);
  if (!carousel) return null;
  const slide = carousel.slides.find((s) => s.id === slideId);
  if (!slide || slide.previousVersions.length === 0) return null;

  const previousHtml = slide.previousVersions.pop()!;
  slide.html = previousHtml;
  carousel.updatedAt = now();
  await save(data);
  return slide;
}

// --- Reference images ---

export async function addReferenceImage(
  carouselId: string,
  image: ReferenceImage
): Promise<ReferenceImage | null> {
  const data = await load();
  const carousel = data.carousels.find((c) => c.id === carouselId);
  if (!carousel) return null;

  if (!carousel.referenceImages) carousel.referenceImages = [];
  carousel.referenceImages.push(image);
  carousel.updatedAt = now();
  await save(data);
  return image;
}

export async function removeReferenceImage(
  carouselId: string,
  imageId: string
): Promise<boolean> {
  const data = await load();
  const carousel = data.carousels.find((c) => c.id === carouselId);
  if (!carousel || !carousel.referenceImages) return false;

  const idx = carousel.referenceImages.findIndex((img) => img.id === imageId);
  if (idx === -1) return false;

  carousel.referenceImages.splice(idx, 1);
  carousel.updatedAt = now();
  await save(data);
  return true;
}
