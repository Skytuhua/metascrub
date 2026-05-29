import { describe, it, expect } from 'vitest';
import { scrubPng } from './png';
import { STRIP_ALL, PRIVACY_PRESET } from '../types';
import { buildPng, pngChunkTypes } from '../../test/fixtures';

describe('scrubPng', () => {
  it('strip-all removes all metadata chunks but keeps rendering chunks', () => {
    const out = scrubPng(buildPng(), STRIP_ALL);
    const types = pngChunkTypes(out);
    expect(types).toContain('IHDR');
    expect(types).toContain('IDAT');
    expect(types).toContain('IEND');
    for (const meta of ['eXIf', 'tEXt', 'zTXt', 'iTXt', 'iCCP', 'tIME']) {
      expect(types).not.toContain(meta);
    }
  });

  it('privacy preset keeps the ICC color profile (iCCP) but drops EXIF/text', () => {
    const out = scrubPng(buildPng(), PRIVACY_PRESET);
    const types = pngChunkTypes(out);
    expect(types).toContain('iCCP'); // removeIcc is false in the preset
    expect(types).not.toContain('eXIf');
    expect(types).not.toContain('tEXt');
  });

  it('keeps IDAT bytes intact (lossless)', () => {
    const input = buildPng();
    const out = scrubPng(input, STRIP_ALL);
    // IDAT data is "fakeimagedata"; ensure it survived unmodified.
    const text = String.fromCharCode(...out);
    expect(text).toContain('fakeimagedata');
  });

  it('returns input unchanged if signature is invalid', () => {
    const bogus = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(scrubPng(bogus, STRIP_ALL)).toBe(bogus);
  });
});
