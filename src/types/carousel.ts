// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
export type AspectRatio = "1:1" | "4:5" | "9:16";

export interface Slide {
  id: string;
  html: string;
  previousVersions: string[];
  order: number;
  notes: string;
}

export interface ReferenceImage {
  id: string;
  url: string;       // e.g. "/uploads/abc.png"
  absPath: string;    // absolute path for Claude to Read
  name: string;       // original filename or description
  addedAt: string;
}

export interface Carousel {
  id: string;
  name: string;
  aspectRatio: AspectRatio;
  slides: Slide[];
  referenceImages: ReferenceImage[];
  caption?: string;
  hashtags?: string[];
  chatSessionId: string | null;
  isTemplate: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CarouselsData {
  carousels: Carousel[];
}

export const DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
};

export const MAX_SLIDES = 20;
export const MAX_VERSIONS = 5;
