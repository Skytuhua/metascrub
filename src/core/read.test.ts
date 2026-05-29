import { describe, it, expect } from 'vitest';
import { readMetadata } from './read';
import { buildPng, buildGif, bytes } from '../test/fixtures';

describe('readMetadata', () => {
  it('reports dimensions for PNG', async () => {
    const r = await readMetadata(buildPng(), 'x.png');
    expect(r.format).toBe('png');
    expect(r.width).toBe(1);
    expect(r.height).toBe(1);
    expect(r.capability).toBe('lossless');
  });

  it('reports dimensions for GIF', async () => {
    const r = await readMetadata(buildGif(), 'x.gif');
    expect(r.format).toBe('gif');
    expect(r.width).toBe(1);
    expect(r.height).toBe(1);
  });

  it('never throws on garbage input', async () => {
    const r = await readMetadata(bytes(0, 1, 2, 3, 4, 5, 6, 7), 'junk.bin');
    expect(r.format).toBe('unknown');
    expect(r.hasMetadata).toBe(false);
    expect(r.capability).toBe('readonly');
  });

  it('handles empty input', async () => {
    const r = await readMetadata(new Uint8Array(0), '');
    expect(r.hasMetadata).toBe(false);
    expect(r.size).toBe(0);
  });
});
