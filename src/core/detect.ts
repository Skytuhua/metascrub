import type { ImageFormat, ScrubCapability } from './types';

/**
 * Detect the image format from magic bytes (preferred) with a filename
 * extension fallback. Magic-byte sniffing is authoritative because a file's
 * extension can lie.
 */
export function detectFormat(bytes: Uint8Array, filename = ''): ImageFormat {
  const b = bytes;

  // JPEG: FF D8 FF
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return 'jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    b.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  ) {
    return 'png';
  }

  // GIF: "GIF87a" or "GIF89a"
  if (b.length >= 6 && ascii(b, 0, 3) === 'GIF') {
    return 'gif';
  }

  // RIFF....WEBP
  if (b.length >= 12 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') {
    return 'webp';
  }

  // TIFF: "II*\0" (little-endian) or "MM\0*" (big-endian)
  if (
    b.length >= 4 &&
    ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2a && b[3] === 0x00) ||
      (b[0] === 0x4d && b[1] === 0x4d && b[2] === 0x00 && b[3] === 0x2a))
  ) {
    return 'tiff';
  }

  // ISO-BMFF (HEIC/AVIF): bytes 4-8 == "ftyp", then a brand.
  if (b.length >= 12 && ascii(b, 4, 4) === 'ftyp') {
    const brand = ascii(b, 8, 4);
    if (brand.startsWith('avif') || brand.startsWith('avis')) return 'avif';
    if (
      brand.startsWith('heic') ||
      brand.startsWith('heix') ||
      brand.startsWith('hevc') ||
      brand.startsWith('mif1') ||
      brand.startsWith('msf1') ||
      brand.startsWith('heif')
    ) {
      return 'heic';
    }
  }

  // Fallback to extension.
  return fromExtension(filename);
}

function fromExtension(filename: string): ImageFormat {
  const ext = filename.toLowerCase().split('.').pop() ?? '';
  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'jpe':
      return 'jpeg';
    case 'png':
      return 'png';
    case 'gif':
      return 'gif';
    case 'webp':
      return 'webp';
    case 'tif':
    case 'tiff':
      return 'tiff';
    case 'avif':
      return 'avif';
    case 'heic':
    case 'heif':
      return 'heic';
    default:
      return 'unknown';
  }
}

/** Canonical MIME type for a format. */
export function mimeFor(format: ImageFormat): string {
  switch (format) {
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'tiff':
      return 'image/tiff';
    case 'avif':
      return 'image/avif';
    case 'heic':
      return 'image/heic';
    default:
      return 'application/octet-stream';
  }
}

/** How a format can be scrubbed in the browser. */
export function capabilityFor(format: ImageFormat): ScrubCapability {
  switch (format) {
    case 'jpeg':
    case 'png':
    case 'webp':
    case 'gif':
      return 'lossless';
    case 'heic':
    case 'avif':
      return 'reencode';
    case 'tiff':
    case 'unknown':
    default:
      return 'readonly';
  }
}

function ascii(b: Uint8Array, start: number, len: number): string {
  let s = '';
  for (let i = start; i < start + len && i < b.length; i++) {
    s += String.fromCharCode(b[i]);
  }
  return s;
}
