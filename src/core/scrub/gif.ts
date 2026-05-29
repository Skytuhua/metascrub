import type { ScrubOptions } from '../types';
import { concat, ascii } from './bytes';

/**
 * Scrub a GIF **losslessly**. GIF has no EXIF/GPS; the identifying metadata it
 * can carry lives in Comment Extensions and the XMP Application Extension. We
 * drop those while preserving all graphics blocks and the NETSCAPE/ANIMEXTS
 * looping extension (so animation still works).
 *
 * Robustness: all reads are bounds-checked and sub-block walking is bounded to
 * the buffer. On malformed/truncated input (including a non-conformant XMP
 * "magic trailer") the parser fails safe — it copies the remainder verbatim and
 * stops, so it can never read out of bounds, hang, or corrupt the image by
 * over-consuming. Conformant GIFs (whose XMP magic trailer is crafted so a
 * sub-block walker lands exactly on the terminator) strip correctly.
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
  if (i >= b.length) return bytes;

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
      if (i + 10 > b.length) {
        kept.push(b.subarray(i));
        break;
      }
      const start = i;
      const imgPacked = b[i + 9];
      let j = i + 10;
      if (imgPacked & 0x80) {
        j += 3 * (1 << ((imgPacked & 0x07) + 1));
      }
      j += 1; // LZW minimum code size
      const end = skipSubBlocks(b, j);
      if (end < 0) {
        kept.push(b.subarray(start)); // malformed — keep remainder verbatim
        break;
      }
      kept.push(b.subarray(start, end));
      i = end;
      continue;
    }

    if (block === 0x21) {
      // Extension: introducer + label, then sub-blocks.
      if (i + 3 > b.length) {
        kept.push(b.subarray(i));
        break;
      }
      const label = b[i + 1];
      const start = i;
      const end = skipSubBlocks(b, i + 2);
      if (end < 0) {
        kept.push(b.subarray(start)); // malformed — keep remainder verbatim
        break;
      }

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

/**
 * Advance past a GIF sub-block list (len-prefixed blocks ending with 0x00).
 * Returns the index just past the 0x00 terminator, or -1 if the list is
 * malformed/truncated (a sub-block running past the buffer, or no terminator).
 */
function skipSubBlocks(b: Uint8Array, i: number): number {
  while (i < b.length) {
    const len = b[i];
    i += 1;
    if (len === 0) return i;
    if (i + len > b.length) return -1; // sub-block claims more than is present
    i += len;
  }
  return -1; // ran off the end without a terminator
}
