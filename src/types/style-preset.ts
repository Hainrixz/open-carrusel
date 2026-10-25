// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
import type { AspectRatio } from "./carousel";
import type { BrandConfig } from "./brand";

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  brand: BrandConfig;
  designRules: string;
  exampleSlideHtml: string;
  aspectRatio: AspectRatio;
  tags: string[];
  createdAt: string;
}

export interface StylePresetsData {
  presets: StylePreset[];
}
