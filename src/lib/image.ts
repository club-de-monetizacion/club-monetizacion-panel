/** Resizes/compresses an image file in the browser and returns a JPEG data
 * URL, so uploads (avatars, video covers) can be stored directly without
 * needing external file storage. */
export async function fileToCompressedDataUrl(
  file: File,
  { width = 256, height = 256, quality = 0.85 }: {
    width?: number;
    height?: number;
    quality?: number;
  } = {}
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const scale = Math.max(width / bitmap.width, height / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (width - w) / 2, (height - h) / 2, w, h);

  return canvas.toDataURL("image/jpeg", quality);
}

/** Scales an image down to fit within `maxDimension` (preserving aspect
 * ratio, never upscaling) — used for screenshots/attachments where cropping
 * to a fixed box (like fileToCompressedDataUrl does) would cut content off. */
export async function fileToScaledDataUrl(
  file: File,
  maxDimension = 1600,
  quality = 0.85
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);

  return canvas.toDataURL("image/jpeg", quality);
}

/** Reads a non-image file (PDF, Word doc, etc.) as a data URL as-is. */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
