import piexif from 'piexifjs';
import { concat } from './bytes';

/** Convert raw bytes to a latin1 "binary string" (piexifjs's data format). */
export function bytesToBinary(bytes: Uint8Array): string {
  let s = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
  }
  return s;
}

/** Convert a latin1 "binary string" back to bytes. */
export function binaryToBytes(str: string): Uint8Array {
  const out = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 0xff;
  return out;
}

/** True if the JPEG carries an embedded EXIF thumbnail. */
export function hasJpegThumbnail(bytes: Uint8Array): boolean {
  try {
    const dict = piexif.load(bytesToBinary(bytes));
    return typeof dict.thumbnail === 'string' && dict.thumbnail.length > 0;
  } catch {
    return false;
  }
}

/** Which marker segments a strip pass should drop. */
export interface SegmentStripConfig {
  dropExif: boolean; // APP1 "Exif\0\0"
  dropXmp: boolean; // APP1 Adobe XMP
  dropIcc: boolean; // APP2 "ICC_PROFILE"
  dropIptc: boolean; // APP13 "Photoshop 3.0"
  dropJfxxThumb: boolean; // APP0 "JFXX" thumbnail variant
  dropComment: boolean; // COM (FE)
  dropUnknownApp: boolean; // any other APPn carrying metadata
}

const ID = {
  EXIF: 'Exif\0\0',
  XMP: 'http://ns.adobe.com/xap/1.0/\0',
  XMP_EXT: 'http://ns.adobe.com/xmp/extension/\0',
  ICC: 'ICC_PROFILE\0',
  PHOTOSHOP: 'Photoshop 3.0\0',
  JFIF: 'JFIF\0',
  JFXX: 'JFXX\0',
  ADOBE: 'Adobe\0',
};

function startsWith(b: Uint8Array, off: number, sig: string): boolean {
  if (off + sig.length > b.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (b[off + i] !== (sig.charCodeAt(i) & 0xff)) return false;
  }
  return true;
}

/**
 * Walk a JPEG's header marker segments and drop the metadata-bearing ones the
 * config selects, copying the compressed scan (from SOS to EOF) verbatim. This
 * is **lossless**: pixel/entropy data is never touched or re-encoded.
 */
export function segmentStrip(bytes: Uint8Array, cfg: SegmentStripConfig): Uint8Array {
  const b = bytes;
  // Must start with SOI (FFD8).
  if (b.length < 2 || b[0] !== 0xff || b[1] !== 0xd8) return bytes;

  const kept: Uint8Array[] = [b.subarray(0, 2)]; // SOI
  let i = 2;

  while (i + 1 < b.length) {
    if (b[i] !== 0xff) {
      // Misaligned — bail out safely by copying the remainder verbatim.
      kept.push(b.subarray(i));
      i = b.length;
      break;
    }
    const marker = b[i + 1];

    // Start of Scan: copy SOS header + all remaining compressed data verbatim.
    if (marker === 0xda) {
      kept.push(b.subarray(i));
      i = b.length;
      break;
    }
    // EOI with nothing after — copy and stop.
    if (marker === 0xd9) {
      kept.push(b.subarray(i, i + 2));
      i += 2;
      break;
    }
    // Standalone markers (TEM / RSTn) have no length payload.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      kept.push(b.subarray(i, i + 2));
      i += 2;
      continue;
    }

    // Length-prefixed segment.
    if (i + 4 > b.length) {
      kept.push(b.subarray(i));
      break;
    }
    const len = (b[i + 2] << 8) | b[i + 3];
    const segEnd = i + 2 + len;
    if (len < 2 || segEnd > b.length) {
      kept.push(b.subarray(i));
      break;
    }
    const payloadOff = i + 4;
    const drop = shouldDrop(marker, b, payloadOff, cfg);
    if (!drop) kept.push(b.subarray(i, segEnd));
    i = segEnd;
  }

  return concat(kept);
}

function shouldDrop(marker: number, b: Uint8Array, payloadOff: number, cfg: SegmentStripConfig): boolean {
  // COM comment
  if (marker === 0xfe) return cfg.dropComment;

  if (marker < 0xe0 || marker > 0xef) return false; // not an APPn — keep

  const appN = marker - 0xe0;

  if (appN === 0) {
    if (startsWith(b, payloadOff, ID.JFXX)) return cfg.dropJfxxThumb;
    if (startsWith(b, payloadOff, ID.JFIF)) return false; // harmless density info — keep
    return cfg.dropUnknownApp;
  }
  if (appN === 1) {
    if (startsWith(b, payloadOff, ID.EXIF)) return cfg.dropExif;
    if (startsWith(b, payloadOff, ID.XMP) || startsWith(b, payloadOff, ID.XMP_EXT)) return cfg.dropXmp;
    return cfg.dropUnknownApp;
  }
  if (appN === 2) {
    if (startsWith(b, payloadOff, ID.ICC)) return cfg.dropIcc;
    return cfg.dropUnknownApp;
  }
  if (appN === 13) {
    if (startsWith(b, payloadOff, ID.PHOTOSHOP)) return cfg.dropIptc;
    return cfg.dropUnknownApp;
  }
  if (appN === 14) {
    // Adobe APP14 carries the color transform — removing it can corrupt colors.
    if (startsWith(b, payloadOff, ID.ADOBE)) return false;
    return cfg.dropUnknownApp;
  }
  // Any other APPn (3–12, 15) is non-essential metadata.
  return cfg.dropUnknownApp;
}
