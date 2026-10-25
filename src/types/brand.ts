// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
}

export interface BrandFonts {
  heading: string;
  body: string;
}

export interface CustomFont {
  name: string;
  path: string;
}

export interface BrandConfig {
  name: string;
  colors: BrandColors;
  fonts: BrandFonts;
  customFonts: CustomFont[];
  logoPath: string | null;
  styleKeywords: string[];
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_BRAND: BrandConfig = {
  name: "",
  colors: {
    primary: "#1a1a2e",
    secondary: "#16213e",
    accent: "#e94560",
    background: "#ffffff",
    surface: "#f5f5f5",
  },
  fonts: {
    heading: "Inter",
    body: "Inter",
  },
  customFonts: [],
  logoPath: null,
  styleKeywords: [],
  createdAt: "",
  updatedAt: "",
};
