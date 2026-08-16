import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { generateId } from "@/lib/utils";
import { getCarousel } from "@/lib/carousels";
import {
  MagnificError,
  MAX_PROMPT_LENGTH,
  downloadImage,
  generateImage,
  isMagnificConfigured,
} from "@/lib/magnific";
import { DIMENSIONS, type AspectRatio } from "@/types/carousel";

export const runtime = "nodejs";
export const maxDuration = 300;

const UPLOAD_DIR = path.resolve(process.cwd(), "public/uploads");
const MAX_PROMPTS = 4;
const VALID_RATIOS: AspectRatio[] = ["1:1", "4:5", "9:16"];

interface Body {
  prompt?: string;
  prompts?: string[];
  aspectRatio?: AspectRatio;
  carouselId?: string;
  seed?: number;
}

interface ImageResult {
  prompt: string;
  url?: string;
  taskId?: string;
  error?: string;
}

/**
 * Generates slide imagery with Magnific and stores it locally.
 *
 * The agent calls this over curl the same way it calls the slide routes, then references
 * the returned /uploads path from the slide HTML. Images are cropped to the carousel's
 * exact pixel size so a full-bleed background never gets letterboxed, and written as JPEG
 * because export inlines every image as base64 into the page it screenshots.
 */
export async function POST(request: Request) {
  if (!isMagnificConfigured()) {
    return NextResponse.json(
      {
        error:
          "Image generation is off. Set MAGNIFIC_API_KEY in .env.local and restart the dev server.",
      },
      { status: 503 }
    );
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompts = (body.prompts ?? (body.prompt ? [body.prompt] : []))
    .filter((p): p is string => typeof p === "string")
    .map((p) => p.trim())
    .filter(Boolean);

  if (prompts.length === 0) {
    return NextResponse.json(
      { error: "Provide 'prompt' (string) or 'prompts' (array of strings)" },
      { status: 400 }
    );
  }
  if (prompts.length > MAX_PROMPTS) {
    return NextResponse.json(
      { error: `Too many prompts (max ${MAX_PROMPTS} per request)` },
      { status: 400 }
    );
  }
  const tooLong = prompts.find((p) => p.length > MAX_PROMPT_LENGTH);
  if (tooLong) {
    return NextResponse.json(
      { error: `Prompt exceeds ${MAX_PROMPT_LENGTH} characters` },
      { status: 400 }
    );
  }
  if (body.aspectRatio && !VALID_RATIOS.includes(body.aspectRatio)) {
    return NextResponse.json(
      { error: `Invalid aspectRatio. Use one of: ${VALID_RATIOS.join(", ")}` },
      { status: 400 }
    );
  }
  if (
    body.seed !== undefined &&
    (!Number.isInteger(body.seed) || body.seed < 0 || body.seed > 4294967295)
  ) {
    return NextResponse.json(
      { error: "seed must be an integer between 0 and 4294967295" },
      { status: 400 }
    );
  }

  let aspectRatio: AspectRatio = body.aspectRatio ?? "4:5";
  if (!body.aspectRatio && body.carouselId) {
    const carousel = await getCarousel(body.carouselId);
    if (carousel) aspectRatio = carousel.aspectRatio;
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const results: ImageResult[] = await Promise.all(
    prompts.map(async (prompt, index): Promise<ImageResult> => {
      try {
        const { taskId, sourceUrl } = await generateImage({
          prompt,
          aspectRatio,
          // One seed per request keeps a batch reproducible without cloning the images.
          seed: body.seed !== undefined ? body.seed + index : undefined,
        });
        const url = await storeImage(sourceUrl, aspectRatio);
        return { prompt, url, taskId };
      } catch (err) {
        const message =
          err instanceof MagnificError
            ? err.message
            : `Image generation failed: ${(err as Error).message}`;
        console.error("[images] generation failed", { prompt, message });
        return { prompt, error: message };
      }
    })
  );

  const succeeded = results.filter((r) => r.url);
  if (succeeded.length === 0) {
    const status =
      results[0]?.error?.includes("401") || results[0]?.error?.includes("API key")
        ? 401
        : 502;
    return NextResponse.json(
      { error: results[0]?.error ?? "Image generation failed", images: results },
      { status }
    );
  }

  const { width, height } = DIMENSIONS[aspectRatio];
  return NextResponse.json({
    aspectRatio,
    width,
    height,
    images: results,
  });
}

/** Crops to the slide's exact dimensions and writes it into public/uploads. */
async function storeImage(
  sourceUrl: string,
  aspectRatio: AspectRatio
): Promise<string> {
  const { width, height } = DIMENSIONS[aspectRatio];
  const original = await downloadImage(sourceUrl);

  const processed = await sharp(original)
    .resize(width, height, { fit: "cover", position: "attention" })
    .toColorspace("srgb")
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  const filename = `${generateId()}.jpg`;
  await writeFile(path.join(UPLOAD_DIR, filename), processed);
  return `/uploads/${filename}`;
}
