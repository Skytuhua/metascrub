/** Shared low-level byte helpers used by the format parsers. */

/** Concatenate byte chunks into one Uint8Array. */
export function concat(parts: Uint8Array[]): Uint8Array {
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

/** Read `len` bytes at `start` as a latin1 ASCII string (bounds-safe). */
export function ascii(b: Uint8Array, start: number, len: number): string {
  let s = '';
  for (let i = start; i < start + len && i < b.length; i++) {
    s += String.fromCharCode(b[i]);
  }
  return s;
}
