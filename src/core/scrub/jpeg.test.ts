import { describe, it, expect } from 'vitest';
import exifr from 'exifr';
import { scrubJpeg } from './jpeg';
import { readMetadata } from '../read';
import { STRIP_ALL, PRIVACY_PRESET } from '../types';
import { buildJpeg, jpegMarkers, jpegImageTail, concat, bytes } from '../../test/fixtures';

const META_MARKERS = [0xe1, 0xe2, 0xed, 0xfe]; // APP1, APP2, APP13, COM

describe('scrubJpeg', () => {
  it('reads the rich metadata from the fixture (sanity check)', async () => {
    const report = await readMetadata(buildJpeg(), 'photo.jpg');
    expect(report.format).toBe('jpeg');
    expect(report.gps).toBeDefined();
    expect(report.gps!.lat).toBeCloseTo(37.8, 1);
    expect(report.gps!.lng).toBeCloseTo(-122.4667, 1);
    expect(report.hasSensitive).toBe(true);
    const labels = report.fields.map((f) => f.label.toLowerCase()).join(' ');
    expect(labels).toContain('make');
    expect(labels).toContain('model');
  });

  it('strip-all removes every metadata marker segment', () => {
    const input = buildJpeg();
    const out = scrubJpeg(input, STRIP_ALL);
    const markers = jpegMarkers(out);
    for (const m of META_MARKERS) {
      expect(markers).not.toContain(m);
    }
    // Output is exactly SOI + image data (nothing else).
    expect(Array.from(out)).toEqual(Array.from(concat([bytes(0xff, 0xd8), jpegImageTail()])));
  });

  it('strip-all leaves the image byte-identical (lossless)', () => {
    const out = scrubJpeg(buildJpeg(), STRIP_ALL);
    const tail = jpegImageTail();
    const outTail = out.subarray(out.length - tail.length);
    expect(Array.from(outTail)).toEqual(Array.from(tail));
  });

  it('re-reads as clean after strip-all', async () => {
    const out = scrubJpeg(buildJpeg(), STRIP_ALL);
    const report = await readMetadata(out, 'photo.clean.jpg');
    expect(report.hasMetadata).toBe(false);
    expect(report.gps).toBeUndefined();
  });

  it('privacy preset removes GPS + camera + software but keeps orientation', async () => {
    const out = scrubJpeg(buildJpeg(), PRIVACY_PRESET);
    const parsed = await exifr.parse(toBuffer(out), { translateKeys: true, translateValues: false, gps: true });
    expect(parsed?.latitude).toBeUndefined();
    expect(parsed?.Make).toBeUndefined();
    expect(parsed?.Model).toBeUndefined();
    expect(parsed?.Software).toBeUndefined();
    expect(parsed?.Orientation).toBe(6); // kept
  });

  it('privacy preset is lossless for the image data', () => {
    const out = scrubJpeg(buildJpeg(), PRIVACY_PRESET);
    const tail = jpegImageTail();
    // The SOF0..EOI tail must appear unchanged at the end of the output.
    const outTail = out.subarray(out.length - tail.length);
    expect(Array.from(outTail)).toEqual(Array.from(tail));
  });

  it('selective: remove only GPS, keep camera info', async () => {
    const opts = { ...PRIVACY_PRESET, removeCamera: false, removeDateTime: false, removeSoftware: false, removeDevice: false };
    const out = scrubJpeg(buildJpeg(), opts);
    const parsed = await exifr.parse(toBuffer(out), { translateKeys: true, translateValues: false, gps: true });
    expect(parsed?.latitude).toBeUndefined(); // GPS gone
    expect(parsed?.Make).toBe('TestMake'); // camera kept
  });

  it('handles a JPEG that has no metadata gracefully', () => {
    const clean = concat([bytes(0xff, 0xd8), jpegImageTail()]);
    const out = scrubJpeg(clean, STRIP_ALL);
    expect(Array.from(out)).toEqual(Array.from(clean));
  });
});

function toBuffer(u: Uint8Array): ArrayBuffer {
  return u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;
}
