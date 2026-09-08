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
