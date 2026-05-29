/**
 * Browser-only HEIC/HEIF handling. Browsers can't natively decode HEIC, so we
 * lazy-load a WASM decoder (kept out of the initial bundle) and convert to a
 * clean JPEG. This is, unavoidably, a re-encode and a format change — the rest
 * of the app edits bytes losslessly, but HEIC can't be edited in place. The UI
 * states this plainly. Everything still runs locally; no upload.
 */
export async function heicToCleanJpeg(
  bytes: Uint8Array,
  quality = 0.92,
): Promise<{ bytes: Uint8Array; mime: string }> {
  const mod = await import('heic2any');
  const heic2any = (mod.default ?? mod) as (opts: {
    blob: Blob;
    toType?: string;
    quality?: number;
  }) => Promise<Blob | Blob[]>;

  const blob = new Blob([bytes as BlobPart], { type: 'image/heic' });
  const result = await heic2any({ blob, toType: 'image/jpeg', quality });
  const outBlob = Array.isArray(result) ? result[0] : result;
  const buf = new Uint8Array(await outBlob.arrayBuffer());
  // heic2any does not copy source metadata into the output, so it is clean.
  return { bytes: buf, mime: 'image/jpeg' };
}
