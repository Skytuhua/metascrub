import type { ScrubOptions } from '../types';

// VP8X feature-flag bits within the flags byte (MSB..LSB): R R I L E X A R.
const FLAG_ICC = 0x20; // bit 5
const FLAG_EXIF = 0x08; // bit 3
const FLAG_XMP = 0x04; // bit 2

/**
 * Scrub a WebP **losslessly** by removing the EXIF / XMP / ICCP chunks from the
 * RIFF container, clearing the matching VP8X feature flags, and fixing the RIFF
 * size. The image bitstream (VP8/VP8L/ANMF) is copied byte-for-byte.
 */
export function scrubWebp(bytes: Uint8Array, opts: ScrubOptions): Uint8Array {
  if (bytes.length < 12 || ascii(bytes, 0, 4) !== 'RIFF' || ascii(bytes, 8, 4) !== 'WEBP') {
    return bytes;
  }

  const dropExif =
    opts.removeGps ||
    opts.removeCamera ||
    opts.removeDateTime ||
    opts.removeSoftware ||
    opts.removeDevice ||
    opts.removeThumbnail ||
    opts.removeIptc;
  const dropXmp = opts.removeXmp || opts.removeSoftware || opts.removeIptc;
  const dropIcc = opts.removeIcc;

  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const kept: Uint8Array[] = [];
  let i = 12; // after "RIFF" + size + "WEBP"

  while (i + 8 <= bytes.length) {
    const fourcc = ascii(bytes, i, 4);
    const size = dv.getUint32(i + 4, true); // little-endian
    const padded = size + (size % 2); // chunks are padded to even length
    const chunkEnd = i + 8 + padded;
    if (chunkEnd > bytes.length) {
      kept.push(bytes.subarray(i)); // malformed tail
      i = bytes.length;
      break;
    }

    let drop = false;
    if (fourcc === 'EXIF') drop = dropExif;
    else if (fourcc === 'XMP ') drop = dropXmp;
    else if (fourcc === 'ICCP') drop = dropIcc;

    if (!drop) {
      const chunk = bytes.slice(i, chunkEnd);
      // Clear VP8X feature flags for whatever we're removing.
      if (fourcc === 'VP8X' && chunk.length >= 9) {
        let flags = chunk[8];
        if (dropExif) flags &= ~FLAG_EXIF;
        if (dropXmp) flags &= ~FLAG_XMP;
        if (dropIcc) flags &= ~FLAG_ICC;
        chunk[8] = flags & 0xff;
      }
      kept.push(chunk);
    }
    i = chunkEnd;
  }

  // Reassemble container with a corrected RIFF size.
  const body = concat(kept);
  const out = new Uint8Array(12 + body.length);
  out.set([0x52, 0x49, 0x46, 0x46], 0); // "RIFF"
  const odv = new DataView(out.buffer);
  odv.setUint32(4, 4 + body.length, true); // size = "WEBP" + chunks
  out.set([0x57, 0x45, 0x42, 0x50], 8); // "WEBP"
  out.set(body, 12);
  return out;
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
