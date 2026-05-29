import { describe, it, expect } from 'vitest';
import { createZip, crc32, sanitizeName } from './zip';
import { enc } from '../test/fixtures';

describe('sanitizeName (zip-slip defense)', () => {
  it('strips path traversal and absolute path segments', () => {
    expect(sanitizeName('../../etc/passwd')).toBe('etc/passwd');
    expect(sanitizeName('/var/secret.jpg')).toBe('var/secret.jpg');
    expect(sanitizeName('C:\\Windows\\evil.jpg')).toBe('Windows/evil.jpg');
    expect(sanitizeName('..')).toBe('image');
    expect(sanitizeName('photo.clean.jpg')).toBe('photo.clean.jpg');
  });
});

describe('crc32', () => {
  it('computes the known CRC32 of "123456789"', () => {
    // The standard CRC-32 check value.
    expect(crc32(enc('123456789'))).toBe(0xcbf43926);
  });
  it('computes 0 for empty input', () => {
    expect(crc32(new Uint8Array(0))).toBe(0);
  });
});

describe('createZip', () => {
  it('produces a valid ZIP structure with the right signatures', () => {
    const zip = createZip([
      { name: 'a.txt', data: enc('hello') },
      { name: 'b.bin', data: new Uint8Array([1, 2, 3, 4]) },
    ]);
    const dv = new DataView(zip.buffer);
    // First local file header signature.
    expect(dv.getUint32(0, true)).toBe(0x04034b50);
    // End-of-central-directory signature is the last 22 bytes.
    const eocd = new DataView(zip.buffer, zip.length - 22);
    expect(eocd.getUint32(0, true)).toBe(0x06054b50);
    expect(eocd.getUint16(10, true)).toBe(2); // total entries
  });

  it('embeds the file data and names verbatim', () => {
    const zip = createZip([{ name: 'photo.clean.jpg', data: enc('JPEGDATA') }]);
    const text = String.fromCharCode(...zip);
    expect(text).toContain('photo.clean.jpg');
    expect(text).toContain('JPEGDATA');
  });

  it('handles an empty archive', () => {
    const zip = createZip([]);
    expect(zip.length).toBe(22); // just the EOCD
  });
});
