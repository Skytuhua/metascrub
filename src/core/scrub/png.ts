import type { ScrubOptions } from '../types';
import { concat, ascii } from './bytes';

const SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const META_CHUNKS = new Set(['tEXt', 'zTXt', 'iTXt', 'eXIf', 'tIME', 'iCCP']);

/**
 * Scrub a PNG **losslessly** by dropping metadata chunks (tEXt/zTXt/iTXt/eXIf/
 * tIME/iCCP) while copying all rendering-critical chunks (IHDR/PLTE/IDAT/IEND
 * and friends) byte-for-byte. CRCs of kept chunks are preserved untouched.
 */
export function scrubPng(bytes: Uint8Array, opts: ScrubOptions): Uint8Array {
  // Validate signature.
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== SIG[i]) return bytes;
  }

  const dropText = opts.removeXmp || opts.removeSoftware || opts.removeIptc || opts.removeDevice;
  const dropExif =
    opts.removeGps ||
    opts.removeCamera ||
    opts.removeDateTime ||
    opts.removeSoftware ||
    opts.removeDevice ||
    opts.removeThumbnail;
  const dropTime = opts.removeDateTime;
  const dropIcc = opts.removeIcc;

  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const kept: Uint8Array[] = [bytes.subarray(0, 8)];
  let i = 8;

  while (i + 8 <= bytes.length) {
    const len = dv.getUint32(i);
    const type = ascii(bytes, i + 4, 4);
    const chunkEnd = i + 12 + len; // length(4)+type(4)+data(len)+crc(4)

    let drop = false;
    switch (type) {
      case 'tEXt':
      case 'zTXt':
      case 'iTXt':
        drop = dropText;
        break;
      case 'eXIf':
        drop = dropExif;
        break;
      case 'tIME':
        drop = dropTime;
        break;
      case 'iCCP':
        drop = dropIcc;
        break;
      default:
        drop = false;
    }

    if (chunkEnd > bytes.length) {
      // Malformed/truncated final chunk. A scrubber must FAIL SAFE: if it's a
      // metadata chunk we'd drop, discard the tail; otherwise copy it verbatim.
      if (!(drop || META_CHUNKS.has(type))) kept.push(bytes.subarray(i));
      break;
    }

    if (!drop) kept.push(bytes.subarray(i, chunkEnd));
    i = chunkEnd;
    if (type === 'IEND') break;
  }

  return concat(kept);
}
