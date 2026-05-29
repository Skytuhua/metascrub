import { describe, it, expect } from 'vitest';
import { scrubWebp } from './webp';
import { STRIP_ALL, PRIVACY_PRESET } from '../types';
import { buildWebp, webpFourccs, webpVp8xFlags } from '../../test/fixtures';

describe('scrubWebp', () => {
  it('strip-all removes EXIF/XMP/ICCP chunks, keeps the image bitstream', () => {
    const out = scrubWebp(buildWebp(), STRIP_ALL);
    const fourccs = webpFourccs(out);
    expect(fourccs).toContain('VP8X');
    expect(fourccs).toContain('VP8 ');
    expect(fourccs).not.toContain('EXIF');
    expect(fourccs).not.toContain('XMP ');
    expect(fourccs).not.toContain('ICCP');
  });

  it('clears the VP8X feature flags for removed chunks', () => {
    const out = scrubWebp(buildWebp(), STRIP_ALL);
    const flags = webpVp8xFlags(out);
    expect(flags & 0x08).toBe(0); // EXIF flag cleared
    expect(flags & 0x04).toBe(0); // XMP flag cleared
    expect(flags & 0x20).toBe(0); // ICC flag cleared
  });

  it('fixes the RIFF size to match the new length', () => {
    const out = scrubWebp(buildWebp(), STRIP_ALL);
    const dv = new DataView(out.buffer, out.byteOffset, out.byteLength);
    expect(dv.getUint32(4, true)).toBe(out.length - 8);
  });

  it('privacy preset keeps ICCP (color) but removes EXIF/XMP', () => {
    const out = scrubWebp(buildWebp(), PRIVACY_PRESET);
    const fourccs = webpFourccs(out);
    expect(fourccs).toContain('ICCP');
    expect(fourccs).not.toContain('EXIF');
    expect(fourccs).not.toContain('XMP ');
    expect(webpVp8xFlags(out) & 0x20).not.toBe(0); // ICC flag still set
  });
});
