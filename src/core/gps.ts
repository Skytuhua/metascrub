import type { GpsPosition } from './types';

/**
 * Project a lat/lng onto an equirectangular map of the given pixel size.
 * Used to plot a pin on the bundled, fully-offline SVG world map — no map
 * tiles are ever fetched.
 */
export function projectEquirectangular(
  pos: GpsPosition,
  width: number,
  height: number,
): { x: number; y: number } {
  const lng = clamp(pos.lng, -180, 180);
  const lat = clamp(pos.lat, -90, 90);
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

/** Human-readable coordinate string, e.g. "37.81990, -122.47830". */
export function formatCoord(pos: GpsPosition): string {
  return `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`;
}

/**
 * Build an OpenStreetMap URL for the position. This is only ever used for an
 * explicit, user-initiated "open in new tab" link — the app never requests it.
 */
export function osmUrl(pos: GpsPosition): string {
  const lat = pos.lat.toFixed(6);
  const lng = pos.lng.toFixed(6);
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
