import { describe, it, expect } from 'vitest';
import { scrubGif } from './gif';
import { STRIP_ALL } from '../types';
import { buildGif, gifBlocks } from '../../test/fixtures';

describe('scrubGif', () => {
  it('removes comment and XMP extensions but keeps animation + image', () => {
    const out = scrubGif(buildGif(), STRIP_ALL);
    const blocks = gifBlocks(out);
    expect(blocks).not.toContain('comment');
    expect(blocks).not.toContain('xmp');
    expect(blocks).toContain('netscape'); // looping kept
    expect(blocks).toContain('image'); // graphics kept
    expect(blocks).toContain('trailer');
  });

  it('preserves image data bytes (lossless)', () => {
    const out = scrubGif(buildGif(), STRIP_ALL);
    // image sub-block fake data was 0x44 0x01
    expect(Array.from(out)).toContain(0x44);
  });

  it('returns input unchanged for a non-GIF', () => {
    const bogus = new Uint8Array([1, 2, 3, 4, 5]);
    expect(scrubGif(bogus, STRIP_ALL)).toBe(bogus);
  });
});
