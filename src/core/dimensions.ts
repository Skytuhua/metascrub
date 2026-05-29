import type { ImageFormat } from './types';

/** Read pixel dimensions straight from the file header, per format. */
export function readDimensions(
  bytes: Uint8Array,
  format: ImageFormat,
): { width: number; height: number } | undefined {
  try {
    switch (format) {
      case 'png':
        return pngSize(bytes);
      case 'gif':
        return gifSize(bytes);
      case 'jpeg':
        return jpegSize(bytes);
      case 'webp':
        return webpSize(bytes);
      default:
        return undefined;
    }
  } catch {
    return undefined;
  }
}

function pngSize(b: Uint8Array) {
  // IHDR is the first chunk; width @16, height @20 (big-endian uint32).
  if (b.length < 24) return undefined;
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  return { width: dv.getUint32(16), height: dv.getUint32(20) };
}

function gifSize(b: Uint8Array) {
  if (b.length < 10) return undefined;
  const width = b[6] | (b[7] << 8); // little-endian
  const height = b[8] | (b[9] << 8);
  return { width, height };
}

function jpegSize(b: Uint8Array) {
  let i = 2; // skip SOI
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = b[i + 1];
    // SOF markers carry dimensions (exclude DHT/JPG/DAC: C4,C8,CC).
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      const height = (b[i + 5] << 8) | b[i + 6];
      const width = (b[i + 7] << 8) | b[i + 8];
      return { width, height };
    }
    // Skip this segment via its length field.
    const len = (b[i + 2] << 8) | b[i + 3];
    if (len < 2) return undefined;
    i += 2 + len;
  }
  return undefined;
}

function webpSize(b: Uint8Array) {
  if (b.length < 30) return undefined;
  const fourcc = String.fromCharCode(b[12], b[13], b[14], b[15]);
  if (fourcc === 'VP8X') {
    // 24-bit little-endian (canvas dims - 1) at offset 24/27.
    const width = 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
    const height = 1 + (b[27] | (b[28] << 8) | (b[29] << 16));
    return { width, height };
  }
  if (fourcc === 'VP8 ') {
    // Lossy: 16-bit dims at offset 26/28 (14 low bits).
    const width = (b[26] | (b[27] << 8)) & 0x3fff;
    const height = (b[28] | (b[29] << 8)) & 0x3fff;
    return { width, height };
  }
  if (fourcc === 'VP8L') {
    // Lossless: dims packed in 28 bits starting at offset 21.
    const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    return { width, height };
  }
  return undefined;
}
