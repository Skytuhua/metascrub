/**
 * Core domain types for MetaScrub. This module (and everything under `core/`)
 * is pure: no DOM, no React, no network. It works on raw bytes so it can be
 * unit-tested directly in Node.
 */

/** Image formats MetaScrub understands. */
export type ImageFormat =
  | 'jpeg'
  | 'png'
  | 'webp'
  | 'gif'
  | 'tiff'
  | 'avif'
  | 'heic'
  | 'unknown';

/** How thoroughly we can scrub a given format in the browser. */
export type ScrubCapability =
  | 'lossless' // byte-level segment/chunk edit, pixels untouched (jpeg/png/webp/gif)
  | 'reencode' // must decode + re-encode (heic/avif); pixels preserved but format/size change
  | 'readonly'; // metadata is readable but stripping isn't supported in-browser (tiff)

/** Logical groups a metadata field belongs to. */
export type FieldGroup =
  | 'gps'
  | 'camera'
  | 'datetime'
  | 'software'
  | 'device' // serial numbers, owner, unique IDs
  | 'thumbnail'
  | 'iptc'
  | 'xmp'
  | 'icc'
  | 'orientation'
  | 'image' // dimensions, color space — descriptive, not sensitive
  | 'other';

/** A single normalized metadata field for display. */
export interface MetadataField {
  /** Raw tag key (e.g. "GPSLatitude", "Model"). */
  key: string;
  /** Human label (e.g. "GPS Latitude"). */
  label: string;
  /** Display value as a string. */
  value: string;
  group: FieldGroup;
  /** True if this field can reveal who/where you are. */
  sensitive: boolean;
  /** Short plain-English why-it-matters note, for sensitive fields. */
  note?: string;
}

/** Parsed GPS position, if present. */
export interface GpsPosition {
  lat: number;
  lng: number;
  /** Altitude in metres, if present. */
  altitude?: number;
}

/** The full normalized result of reading an image's metadata. */
export interface MetadataReport {
  format: ImageFormat;
  /** MIME type, e.g. "image/jpeg". */
  mime: string;
  /** File size in bytes. */
  size: number;
  width?: number;
  height?: number;
  fields: MetadataField[];
  gps?: GpsPosition;
  /** True if the image carries any metadata at all. */
  hasMetadata: boolean;
  /** True if any sensitive field is present. */
  hasSensitive: boolean;
  /** True if an embedded thumbnail/preview is present. */
  hasThumbnail: boolean;
  /** How this format can be scrubbed in-browser. */
  capability: ScrubCapability;
}

/**
 * What the user wants removed. Each flag, when true, means "remove this group".
 * A `true` value across the board = strip everything.
 */
export interface ScrubOptions {
  removeGps: boolean;
  removeCamera: boolean;
  removeDateTime: boolean;
  removeSoftware: boolean;
  removeDevice: boolean;
  removeThumbnail: boolean;
  removeIptc: boolean;
  removeXmp: boolean;
  removeIcc: boolean;
  /** Orientation is special: removing it can rotate a photo, so default keep. */
  removeOrientation: boolean;
}

/** Convenience: remove absolutely everything. */
export const STRIP_ALL: ScrubOptions = {
  removeGps: true,
  removeCamera: true,
  removeDateTime: true,
  removeSoftware: true,
  removeDevice: true,
  removeThumbnail: true,
  removeIptc: true,
  removeXmp: true,
  removeIcc: true,
  removeOrientation: true,
};

/** Privacy preset: kill identifying data, keep orientation + color profile. */
export const PRIVACY_PRESET: ScrubOptions = {
  removeGps: true,
  removeCamera: true,
  removeDateTime: true,
  removeSoftware: true,
  removeDevice: true,
  removeThumbnail: true,
  removeIptc: true,
  removeXmp: true,
  removeIcc: false,
  removeOrientation: false,
};

/** Result of a scrub operation. */
export interface ScrubResult {
  bytes: Uint8Array;
  mime: string;
  /** Filename the cleaned file should be saved under. */
  filename: string;
  /** True if the operation changed the format (e.g. HEIC -> JPEG). */
  formatChanged: boolean;
  capability: ScrubCapability;
}
