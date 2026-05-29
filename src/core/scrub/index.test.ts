import { describe, it, expect } from 'vitest';
import { scrub, UnsupportedScrubError } from './index';
import { STRIP_ALL } from '../types';
import { buildJpeg, buildPng, bytes } from '../../test/fixtures';

describe('scrub dispatcher', () => {
  it('scrubs a JPEG and names the output .clean.jpg', async () => {
    const res = await scrub(buildJpeg(), 'IMG_1234.JPG', STRIP_ALL);
    expect(res.mime).toBe('image/jpeg');
    expect(res.filename).toBe('IMG_1234.clean.jpg');
    expect(res.formatChanged).toBe(false);
    expect(res.capability).toBe('lossless');
    expect(res.bytes.length).toBeLessThan(buildJpeg().length); // metadata removed
  });

  it('scrubs a PNG', async () => {
    const res = await scrub(buildPng(), 'shot.png', STRIP_ALL);
    expect(res.mime).toBe('image/png');
    expect(res.filename).toBe('shot.clean.png');
  });

  it('throws UnsupportedScrubError for TIFF', async () => {
    const tiff = bytes(0x49, 0x49, 0x2a, 0x00, 0, 0, 0, 0);
    await expect(scrub(tiff, 'scan.tiff', STRIP_ALL)).rejects.toBeInstanceOf(UnsupportedScrubError);
  });

  it('throws UnsupportedScrubError for unknown formats', async () => {
    await expect(scrub(bytes(1, 2, 3, 4), 'mystery.bin', STRIP_ALL)).rejects.toBeInstanceOf(
      UnsupportedScrubError,
    );
  });
});
