/**
 * Browser-only fallback for formats that cannot be edited at the byte level
 * (AVIF, and HEIC after decode). It decodes the image and re-encodes it via a
 * canvas, which produces a file with **no** metadata. Re-encoding to PNG is
 * lossless with respect to the already-decoded pixels; JPEG is used where size
 * matters (e.g. photos), at high quality. This still happens 100% locally.
 */
export async function reencodeClean(
  bytes: Uint8Array,
  sourceMime: string,
  outType: 'image/png' | 'image/jpeg' = 'image/png',
  quality = 0.92,
): Promise<{ bytes: Uint8Array; mime: string }> {
  const blob = new Blob([bytes as BlobPart], { type: sourceMime });
  const bitmap = await createImageBitmap(blob);

  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();

  const outBlob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, outType, quality),
  );
  if (!outBlob) throw new Error('Image re-encoding failed');

  const buf = new Uint8Array(await outBlob.arrayBuffer());
  return { bytes: buf, mime: outBlob.type || outType };
}
