import sharp from "sharp";

export interface OptimizedImageResult {
  buffer: Buffer;
  contentType: "image/webp";
  extension: ".webp";
  width: number;
  height: number;
  size: number;
}

export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  sharpen?: boolean;
}

/**
 * High-performance image processor:
 * - Auto-rotates orientation using EXIF
 * - Resamples with Lanczos3 kernel to max dimension (default: 1600px)
 * - Applies gentle unsharp mask to ensure fabric textures and edges stay crisp
 * - Encodes into ultra-clear, highly compressed WebP format
 */
export async function processAndOptimizeImage(
  inputBuffer: Buffer,
  options: OptimizeOptions = {}
): Promise<OptimizedImageResult> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 90,
    sharpen = true,
  } = options;

  let pipeline = sharp(inputBuffer).rotate();

  const metadata = await pipeline.metadata();

  // Downscale only if larger than maxWidth or maxHeight (never stretch small images)
  if (
    (metadata.width && metadata.width > maxWidth) ||
    (metadata.height && metadata.height > maxHeight)
  ) {
    pipeline = pipeline.resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    });
  }

  // Apply subtle professional sharpening to make bag textures, stitches, and borders razor sharp
  if (sharpen) {
    pipeline = pipeline.sharpen({
      sigma: 1.0,
      m1: 0.6,
      m2: 0.4,
    });
  }

  // High-fidelity WebP output
  const optimizedBuffer = await pipeline
    .webp({
      quality,
      effort: 4,
      smartSubsample: true,
    })
    .toBuffer();

  const finalMeta = await sharp(optimizedBuffer).metadata();

  return {
    buffer: optimizedBuffer,
    contentType: "image/webp",
    extension: ".webp",
    width: finalMeta.width || 0,
    height: finalMeta.height || 0,
    size: optimizedBuffer.length,
  };
}
