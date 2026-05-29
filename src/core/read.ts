import exifr from 'exifr';
import type { MetadataField, MetadataReport, GpsPosition } from './types';
import { detectFormat, mimeFor, capabilityFor } from './detect';
import { classify } from './sensitivity';
import { readDimensions } from './dimensions';
import { hasJpegThumbnail } from './scrub/jpeg-util';

/** Keys we never surface as individual fields (binary blobs / redundant GPS parts). */
const SKIP_KEYS = new Set(
  [
    'makerNote',
    'thumbnail',
    'ThumbnailOffset',
    'ThumbnailLength',
    'GPSLatitude',
    'GPSLongitude',
    'GPSLatitudeRef',
    'GPSLongitudeRef',
    'GPSAltitudeRef',
    'GPSVersionID',
    'ApplicationNotes', // raw XMP packet (shown via parsed XMP fields instead)
  ].map((k) => k.toLowerCase()),
);

/** Options telling exifr to extract every metadata block it can. */
const EXIFR_OPTIONS = {
  tiff: true,
  ifd0: true,
  ifd1: true,
  exif: true,
  gps: true,
  interop: true,
  xmp: true,
  iptc: true,
  icc: true,
  jfif: true,
  ihdr: true,
  makerNote: false,
  userComment: true,
  translateKeys: true,
  translateValues: true,
  reviveValues: true,
  sanitize: true,
  mergeOutput: true,
} as const;

/**
 * Read and normalize all metadata from an image's raw bytes. Never throws:
 * unreadable/clean images return a report with `hasMetadata: false`.
 */
export async function readMetadata(bytes: Uint8Array, filename = ''): Promise<MetadataReport> {
  const format = detectFormat(bytes, filename);
  const mime = mimeFor(format);
  const capability = capabilityFor(format);
  const dims = readDimensions(bytes, format);

  let parsed: Record<string, unknown> | undefined;
  try {
    parsed = (await exifr.parse(asArrayBuffer(bytes), EXIFR_OPTIONS)) as Record<string, unknown> | undefined;
  } catch {
    parsed = undefined;
  }

  const fields: MetadataField[] = [];
  let gps: GpsPosition | undefined;

  if (parsed) {
    // GPS computed lat/lng (exifr merges these as `latitude`/`longitude`).
    const lat = numberOrUndefined(parsed.latitude);
    const lng = numberOrUndefined(parsed.longitude);
    if (lat !== undefined && lng !== undefined) {
      gps = { lat, lng };
      const alt = numberOrUndefined(parsed.GPSAltitude);
      if (alt !== undefined) gps.altitude = alt;
    }

    for (const [key, raw] of Object.entries(parsed)) {
      if (raw === undefined || raw === null) continue;
      if (SKIP_KEYS.has(key.toLowerCase())) continue;
      // latitude/longitude are surfaced through the dedicated GPS section UI,
      // but we still list them as fields for full transparency.
      const value = formatValue(raw);
      if (value === '') continue;
      const c = classify(key);
      fields.push({ key, label: c.label, value, group: c.group, sensitive: c.sensitive, note: c.note });
    }
  }

  // Detect an embedded JPEG thumbnail directly (more reliable than tag offsets).
  let hasThumbnail = false;
  if (format === 'jpeg') {
    hasThumbnail = hasJpegThumbnail(bytes);
  } else {
    hasThumbnail = fields.some((f) => f.group === 'thumbnail');
  }
  if (hasThumbnail && !fields.some((f) => f.group === 'thumbnail')) {
    fields.push({
      key: 'EmbeddedThumbnail',
      label: 'Embedded Thumbnail',
      value: 'present',
      group: 'thumbnail',
      sensitive: true,
      note: 'An embedded preview image can retain the original (un-edited) photo.',
    });
  }

  const hasSensitive = fields.some((f) => f.sensitive) || gps !== undefined;
  const hasMetadata = fields.length > 0 || gps !== undefined;

  return {
    format,
    mime,
    size: bytes.length,
    width: dims?.width,
    height: dims?.height,
    fields: sortFields(fields),
    gps,
    hasMetadata,
    hasSensitive,
    hasThumbnail,
    capability,
  };
}

/** Sort so sensitive fields (GPS first) lead, then by group, then label. */
function sortFields(fields: MetadataField[]): MetadataField[] {
  const groupRank: Record<string, number> = {
    gps: 0,
    device: 1,
    datetime: 2,
    software: 3,
    iptc: 4,
    xmp: 5,
    thumbnail: 6,
    camera: 7,
    orientation: 8,
    icc: 9,
    image: 10,
    other: 11,
  };
  return [...fields].sort((a, b) => {
    if (a.sensitive !== b.sensitive) return a.sensitive ? -1 : 1;
    const gr = (groupRank[a.group] ?? 99) - (groupRank[b.group] ?? 99);
    if (gr !== 0) return gr;
    return a.label.localeCompare(b.label);
  });
}

function formatValue(raw: unknown): string {
  if (raw instanceof Date) return isNaN(raw.getTime()) ? '' : raw.toISOString().replace('.000Z', 'Z');
  if (raw instanceof Uint8Array) return `[${raw.length} bytes]`;
  if (Array.isArray(raw)) {
    if (raw.length > 24 && raw.every((x) => typeof x === 'number')) return `[${raw.length} values]`;
    return raw.map((x) => formatValue(x)).join(', ');
  }
  if (typeof raw === 'object') {
    try {
      return JSON.stringify(raw);
    } catch {
      return String(raw);
    }
  }
  if (typeof raw === 'number') return Number.isInteger(raw) ? String(raw) : trimNum(raw);
  return String(raw).trim();
}

function trimNum(n: number): string {
  return parseFloat(n.toFixed(6)).toString();
}

function numberOrUndefined(v: unknown): number | undefined {
  return typeof v === 'number' && !isNaN(v) ? v : undefined;
}

/** exifr wants an ArrayBuffer/Buffer; give it a tightly-bounded ArrayBuffer. */
function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
