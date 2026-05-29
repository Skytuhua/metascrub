import { describe, it, expect } from 'vitest';
import { cleanName } from './filename';

describe('cleanName', () => {
  it('inserts .clean before a simple extension', () => {
    expect(cleanName('photo.jpg')).toBe('photo.clean.jpg');
  });

  it('lower-cases the extension', () => {
    expect(cleanName('IMG_001.JPEG')).toBe('IMG_001.clean.jpeg');
  });

  it('only splits on the final extension', () => {
    expect(cleanName('archive.tar.gz')).toBe('archive.tar.clean.gz');
  });

  it('handles names with no extension', () => {
    expect(cleanName('noext')).toBe('noext.clean');
  });

  it('keeps leading-dot dotfiles intact', () => {
    expect(cleanName('.hidden')).toBe('.hidden.clean');
  });

  it('applies a forced extension on format change', () => {
    expect(cleanName('IMG.heic', 'jpg')).toBe('IMG.clean.jpg');
    expect(cleanName('IMG.heic', '.JPG')).toBe('IMG.clean.jpg');
  });

  it('falls back to a default base for empty input', () => {
    expect(cleanName('')).toBe('image.clean');
  });
});
