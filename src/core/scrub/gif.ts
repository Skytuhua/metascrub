import type { ScrubOptions } from '../types';

/**
 * Scrub a GIF **losslessly**. GIF has no EXIF/GPS; the identifying metadata it
 * can carry lives in Comment Extensions and the XMP Application Extension. We
 * drop those while preserving all graphics blocks and the NETSCAPE/ANIMEXTS
 * looping extension (so animation still works).
 */
export function scrubGif(bytes: Uint8Array, opts: ScrubOptions): Uint8Array {
  const b = bytes;
  if (b.length < 13 || ascii(b, 0, 3) !== 'GIF') return bytes;

  const dropComment = opts.removeSoftware || opts.removeIptc || opts.removeXmp || opts.removeDevice;
  const dropXmpApp = opts.removeXmp;
  const dropOtherApp = opts.removeXmp || opts.removeSoftware;

  // Header (6) + Logical Screen Descriptor (7).
  const packed = b[10];
  let i = 13;
  if (packed & 0x80) {
    const gctSize = 3 * (1 << ((packed & 0x07) + 1));
    i += gctSize;
  }
  if (i > b.length) return bytes;

  const kept: Uint8Array[] = [b.subarray(0, i)];

  while (i < b.length) {
    const block = b[i];

    if (block === 0x3b) {
      // Trailer.
      kept.push(b.subarray(i, i + 1));
      i += 1;
      break;
    }

    if (block === 0x2c) {
      // Image Descriptor: introducer + 9 bytes, optional local color table,
      // LZW min-code-size byte, then image data sub-blocks.
      const start = i;
      const imgPacked = b[i + 9];
      i += 10;
      if (imgPacked & 0x80) {
        const lctSize = 3 * (1 << ((imgPacked & 0x07) + 1));
        i += lctSize;
      }
      i += 1; // LZW minimum code size
      i = skipSubBlocks(b, i);
      kept.push(b.subarray(start, i));
      continue;
    }

    if (block === 0x21) {
      // Extension: introducer + label, then sub-blocks.
      const label = b[i + 1];
      const start = i;
      const end = skipSubBlocks(b, i + 2);

      let drop = false;
      if (label === 0xfe) {
        drop = dropComment;
      } else if (label === 0xff) {
        const firstLen = b[i + 2];
        const appId = firstLen >= 8 ? ascii(b, i + 3, 8) : '';
        if (appId === 'XMP Data') drop = dropXmpApp;
        else if (appId === 'NETSCAPE' || appId === 'ANIMEXTS') drop = false; // keep looping
        else drop = dropOtherApp;
      }
      if (!drop) kept.push(b.subarray(start, end));
      i = end;
      continue;
    }

    // Unknown byte — copy the remainder verbatim and stop, to stay safe.
    kept.push(b.subarray(i));
    break;
  }

  return concat(kept);
}

/** Advance past a GIF sub-block list (len-prefixed blocks ending with 0x00). */
function skipSubBlocks(b: Uint8Array, i: number): number {
  while (i < b.length) {
    const len = b[i];
    i += 1;
    if (len === 0) break;
    i += len;
  }
  return i;
}

function ascii(b: Uint8Array, off: number, len: number): string {
  let s = '';
  for (let j = 0; j < len; j++) s += String.fromCharCode(b[off + j]);
  return s;
}

function concat(parts: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}
