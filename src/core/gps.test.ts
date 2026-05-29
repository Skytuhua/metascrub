import { describe, it, expect } from 'vitest';
import { projectEquirectangular, formatCoord, osmUrl } from './gps';

describe('projectEquirectangular', () => {
  it('maps (0,0) to the centre of the map', () => {
    const p = projectEquirectangular({ lat: 0, lng: 0 }, 1000, 500);
    expect(p.x).toBeCloseTo(500);
    expect(p.y).toBeCloseTo(250);
  });
  it('maps the north-west corner correctly', () => {
    const p = projectEquirectangular({ lat: 90, lng: -180 }, 1000, 500);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
  });
  it('clamps out-of-range coordinates', () => {
    const p = projectEquirectangular({ lat: 200, lng: 400 }, 1000, 500);
    expect(p.x).toBeLessThanOrEqual(1000);
    expect(p.y).toBeGreaterThanOrEqual(0);
  });
});

describe('formatCoord / osmUrl', () => {
  it('formats coordinates to 5 dp', () => {
    expect(formatCoord({ lat: 37.819901, lng: -122.4783 })).toBe('37.81990, -122.47830');
  });
  it('builds an OpenStreetMap url', () => {
    const url = osmUrl({ lat: 37.8199, lng: -122.4783 });
    expect(url).toContain('openstreetmap.org');
    expect(url).toContain('mlat=37.819900');
    expect(url).toContain('mlon=-122.478300');
  });
});
