import type { ScrubOptions, ScrubResult } from '../types';
import { detectFormat, capabilityFor } from '../detect';
import { cleanName } from '../filename';
import { scrubJpeg } from './jpeg';
import { scrubPng } from './png';
import { scrubWebp } from './webp';
import { scrubGif } from './gif';

/** Thrown when a format's metadata cannot be stripped in the browser (e.g. TIFF). */
export class UnsupportedScrubError extends Error {
  constructor(public readonly format: string) {
    super(`Scrubbing ${format.toUpperCase()} is not supported in the browser`);
    this.name = 'UnsupportedScrubError';
  }
}

/**
 * Scrub an image's metadata according to `opts`. Lossless byte-level editing is
 * used for JPEG/PNG/WebP/GIF; HEIC/AVIF are decoded and re-encoded clean
 * (lazy-loaded, browser-only). TIFF/unknown throw `UnsupportedScrubError`.
 */
export async function scrub(
  bytes: Uint8Array,
  filename: string,
  opts: ScrubOptions,
): Promise<ScrubResult> {
  const format = detectFormat(bytes, filename);
  const capability = capabilityFor(format);

  switch (format) {
    case 'jpeg':
      return result(scrubJpeg(bytes, opts), 'image/jpeg', cleanName(filename), false, capability);
    case 'png':
      return result(scrubPng(bytes, opts), 'image/png', cleanName(filename), false, capability);
    case 'webp':
      return result(scrubWebp(bytes, opts), 'image/webp', cleanName(filename), false, capability);
    case 'gif':
      return result(scrubGif(bytes, opts), 'image/gif', cleanName(filename), false, capability);
    case 'heic': {
      const { heicToCleanJpeg } = await import('./heic');
      const out = await heicToCleanJpeg(bytes);
      return result(out.bytes, out.mime, cleanName(filename, 'jpg'), true, capability);
    }
    case 'avif': {
      const { reencodeClean } = await import('./reencode');
      const out = await reencodeClean(bytes, 'image/avif', 'image/png');
      return result(out.bytes, out.mime, cleanName(filename, 'png'), true, capability);
    }
    default:
      throw new UnsupportedScrubError(format);
  }
}

function result(
  bytes: Uint8Array,
  mime: string,
  filename: string,
  formatChanged: boolean,
  capability: ScrubResult['capability'],
): ScrubResult {
  return { bytes, mime, filename, formatChanged, capability };
}
