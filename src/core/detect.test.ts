import { describe, it, expect } from 'vitest';
import { detectFormat, mimeFor, capabilityFor } from './detect';
import { buildJpeg, buildPng, buildWebp, buildGif, bytes } from '../test/fixtures';

describe('detectFormat', () => {
  it('detects JPEG by magic bytes', () => {
    expect(detectFormat(buildJpeg())).toBe('jpeg');
  });
  it('detects PNG by magic bytes', () => {
    expect(detectFormat(buildPng())).toBe('png');
  });
  it('detects WebP by RIFF/WEBP', () => {
    expect(detectFormat(buildWebp())).toBe('webp');
  });
  it('detects GIF by header', () => {
    expect(detectFormat(buildGif())).toBe('gif');
  });
  it('detects TIFF (little and big endian)', () => {
    expect(detectFormat(bytes(0x49, 0x49, 0x2a, 0x00))).toBe('tiff');
    expect(detectFormat(bytes(0x4d, 0x4d, 0x00, 0x2a))).toBe('tiff');
  });
  it('detects AVIF and HEIC via ftyp brand', () => {
    const avif = bytes(0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66);
    const heic = bytes(0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63);
    expect(detectFormat(avif)).toBe('avif');
    expect(detectFormat(heic)).toBe('heic');
  });
  it('falls back to extension when magic bytes are unknown', () => {
    expect(detectFormat(bytes(0, 1, 2, 3), 'mystery.png')).toBe('png');
    expect(detectFormat(bytes(0, 1, 2, 3), 'mystery.heic')).toBe('heic');
  });
  it('returns unknown for unrecognized input', () => {
    expect(detectFormat(bytes(0, 1, 2, 3), 'file.bin')).toBe('unknown');
  });
  it('does not trust a lying extension over magic bytes', () => {
    // PNG bytes but a .jpg name -> still PNG.
    expect(detectFormat(buildPng(), 'fake.jpg')).toBe('png');
  });
});

describe('mimeFor / capabilityFor', () => {
  it('maps mime types', () => {
    expect(mimeFor('jpeg')).toBe('image/jpeg');
    expect(mimeFor('webp')).toBe('image/webp');
    expect(mimeFor('unknown')).toBe('application/octet-stream');
  });
  it('maps scrub capability', () => {
    expect(capabilityFor('jpeg')).toBe('lossless');
    expect(capabilityFor('heic')).toBe('reencode');
    expect(capabilityFor('tiff')).toBe('readonly');
  });
});
