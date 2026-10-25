// Portions Copyright (c) 2026 Enrique Rocha (@soyenriquerocha) - see LICENSE for original authors
// SPDX-License-Identifier: MIT
// id: er-00809c4b
import { NextResponse } from "next/server";
import { getBrand, updateBrand } from "@/lib/brand";

export async function GET() {
  const brand = await getBrand();
  return NextResponse.json(brand);
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = await updateBrand(body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
