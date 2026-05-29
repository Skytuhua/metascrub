import { describe, it, expect } from 'vitest';
import { classify, humanize } from './sensitivity';

describe('classify', () => {
  it('flags GPS fields as sensitive location data', () => {
    const c = classify('GPSLatitude');
    expect(c.group).toBe('gps');
    expect(c.sensitive).toBe(true);
    expect(c.note).toMatch(/where/i);
  });
  it('flags serial numbers as device identifiers', () => {
    expect(classify('BodySerialNumber').group).toBe('device');
    expect(classify('LensSerialNumber').sensitive).toBe(true);
  });
  it('flags software fingerprints', () => {
    expect(classify('Software').group).toBe('software');
    expect(classify('CreatorTool').group).toBe('software');
  });
  it('treats orientation as non-sensitive', () => {
    const c = classify('Orientation');
    expect(c.group).toBe('orientation');
    expect(c.sensitive).toBe(false);
  });
  it('treats dimensions as non-sensitive image data', () => {
    expect(classify('ImageWidth').sensitive).toBe(false);
    expect(classify('ColorSpace').group).toBe('image');
  });
  it('classifies camera make/model and settings', () => {
    expect(classify('Make').group).toBe('camera');
    expect(classify('FNumber').group).toBe('camera');
    expect(classify('ISO').group).toBe('camera');
  });
  it('classifies datetime fields', () => {
    expect(classify('DateTimeOriginal').group).toBe('datetime');
    expect(classify('CreateDate').sensitive).toBe(true);
  });
  it('classifies IPTC place fields with a location note', () => {
    const c = classify('City');
    expect(c.group).toBe('iptc');
    expect(c.note).toMatch(/where/i);
  });
  it('treats namespaced XMP keys as sensitive xmp', () => {
    // A namespaced key with no more-specific match falls through to xmp.
    expect(classify('crs:Contrast').group).toBe('xmp');
    expect(classify('crs:Contrast').sensitive).toBe(true);
    // Authorship-like XMP keys are caught by the more specific IPTC rule.
    expect(classify('dc:creator').group).toBe('iptc');
  });
});

describe('humanize', () => {
  it('splits camelCase and fixes acronyms', () => {
    expect(humanize('GPSLatitude')).toBe('GPS Latitude');
    expect(humanize('lensModel')).toBe('Lens Model');
    expect(humanize('ImageUniqueID')).toBe('Image Unique ID');
  });
  it('drops xmp namespace prefixes', () => {
    expect(humanize('dc:creator')).toBe('Creator');
  });
});
