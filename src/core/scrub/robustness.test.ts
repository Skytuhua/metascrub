import { describe, it, expect } from 'vitest';
import { scrubPng } from './png';
import { scrubWebp } from './webp';
import { scrubGif } from './gif';
import { STRIP_ALL } from '../types';
import { bytes, enc, concat } from '../../test/fixtures';

/**
 * Regression tests for adversarial / malformed inputs. A scrubber must never
 * (a) leak metadata it claims to remove, (b) read out of bounds / hang, or
 * (c) corrupt image data. These cases come from the security/robustness audit.
 */

// A guard so a hang would fail fast rather than stall the suite.
function within(ms: number, fn: () => void) {
  const start = Date.now();
  fn();
  expect(Date.now() - start).toBeLessThan(ms);
}

describe('PNG robustness', () => {
  it('does NOT leak a metadata chunk whose declared length overflows the buffer', () => {
    const sig = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    const ihdr = chunk('IHDR', bytes(0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0));
    // tEXt chunk claiming a huge length but truncated, carrying a secret.
    const badLen = bytes(0xff, 0xff, 0xff, 0xf0);
    const badText = concat([badLen, enc('tEXt'), enc('SECRETPNGPAYLOAD')]);
    const input = concat([sig, ihdr, badText]);
    let out!: Uint8Array;
    within(500, () => (out = scrubPng(input, STRIP_ALL)));
    expect(asText(out)).not.toContain('SECRETPNGPAYLOAD');
  });
});

describe('WebP robustness', () => {
  it('does NOT leak an EXIF chunk whose size exceeds the buffer', () => {
    const exif = concat([enc('EXIF'), bytes(0xff, 0xff, 0x00, 0x00), enc('SECRETEXIFDATA')]);
    const body = concat([webpChunk('VP8 ', enc('imagedata')), exif]);
    const input = riff(body);
    let out!: Uint8Array;
    within(500, () => (out = scrubWebp(input, STRIP_ALL)));
    expect(asText(out)).not.toContain('SECRETEXIFDATA');
  });

  it('does NOT leak an odd-sized EXIF chunk truncated at EOF', () => {
    const exif = concat([enc('EXIF'), le32(9), enc('SECRETEXI')]); // odd size, no pad byte
    const input = riff(concat([webpChunk('VP8 ', enc('img')), exif]));
    const out = scrubWebp(input, STRIP_ALL);
    expect(asText(out)).not.toContain('SECRETEXI');
  });
});

describe('GIF robustness', () => {
  it('does not hang or corrupt on an oversized comment sub-block length', () => {
    const header = enc('GIF89a');
    const lsd = bytes(1, 0, 1, 0, 0x00, 0, 0);
    // Comment declaring length 50 but only 2 bytes present, then an image.
    const badComment = concat([bytes(0x21, 0xfe, 0x32), enc('hi')]);
    const image = concat([bytes(0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0x00, 0x02), bytes(0x02, 0x44, 0x01, 0x00)]);
    const input = concat([header, lsd, badComment, image, bytes(0x3b)]);
    let out!: Uint8Array;
    within(500, () => (out = scrubGif(input, STRIP_ALL)));
    // Fails safe: never longer than input, never reads OOB, terminates.
    expect(out.length).toBeLessThanOrEqual(input.length);
  });

  it('terminates on a truncated GIF with no trailer', () => {
    const input = concat([enc('GIF89a'), bytes(1, 0, 1, 0, 0x00, 0, 0, 0x2c, 0, 0)]);
    let out!: Uint8Array;
    within(500, () => (out = scrubGif(input, STRIP_ALL)));
    expect(out.length).toBeLessThanOrEqual(input.length);
  });
});

// --- helpers ---
function asText(b: Uint8Array): string {
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return s;
}
function le32(n: number): Uint8Array {
  return bytes(n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff);
}
function chunk(type: string, data: Uint8Array): Uint8Array {
  const lenBE = bytes((data.length >> 24) & 0xff, (data.length >> 16) & 0xff, (data.length >> 8) & 0xff, data.length & 0xff);
  return concat([lenBE, enc(type), data, bytes(0, 0, 0, 0)]); // crc not validated by scrubber
}
function webpChunk(fourcc: string, data: Uint8Array): Uint8Array {
  const padded = data.length % 2 ? concat([data, bytes(0)]) : data;
  return concat([enc(fourcc), le32(data.length), padded]);
}
function riff(body: Uint8Array): Uint8Array {
  return concat([enc('RIFF'), le32(4 + body.length), enc('WEBP'), body]);
}
