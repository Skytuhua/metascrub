import type { FieldGroup } from './types';

/** Result of classifying a raw metadata tag. */
export interface Classification {
  group: FieldGroup;
  sensitive: boolean;
  label: string;
  note?: string;
}

/**
 * Classify a raw EXIF/XMP/IPTC tag key into a logical group, decide whether it
 * is privacy-sensitive, and attach a plain-English explanation for sensitive
 * fields. Matching is case-insensitive and based on well-known tag names.
 */
export function classify(key: string): Classification {
  const k = key.toLowerCase();

  // --- GPS / location: the highest-risk group ---
  if (k.startsWith('gps') || k.includes('latitude') || k.includes('longitude') || k === 'location') {
    return {
      group: 'gps',
      sensitive: true,
      label: humanize(key),
      note: 'Reveals exactly where the photo was taken — can expose your home or current location.',
    };
  }

  // --- Device identity: serials, owner, unique IDs ---
  if (
    k.includes('serial') ||
    k.includes('ownername') ||
    k === 'owner' ||
    k.includes('cameraownername') ||
    k.includes('bodyserial') ||
    k.includes('lensserial') ||
    k.includes('imageuniqueid') ||
    k.includes('documentid') ||
    k.includes('instanceid')
  ) {
    return {
      group: 'device',
      sensitive: true,
      label: humanize(key),
      note: 'A unique identifier that can link this photo to your specific device or account.',
    };
  }

  // --- Software / processing fingerprint ---
  if (k === 'software' || k.includes('processingsoftware') || k === 'creatortool' || k.includes('hostcomputer')) {
    return {
      group: 'software',
      sensitive: true,
      label: humanize(key),
      note: 'Reveals the device/app and version used — a fingerprinting signal.',
    };
  }

  // --- Date / time the photo was taken ---
  if (k.includes('datetime') || k === 'createdate' || k === 'modifydate' || k.includes('date')) {
    return {
      group: 'datetime',
      sensitive: true,
      label: humanize(key),
      note: 'Reveals exactly when the photo was taken.',
    };
  }

  // --- Camera / capture settings (mildly identifying) ---
  if (
    k === 'make' ||
    k === 'model' ||
    k === 'lensmodel' ||
    k === 'lensmake' ||
    k === 'lens' ||
    k.includes('exposure') ||
    k === 'fnumber' ||
    k === 'iso' ||
    k.includes('isospeed') ||
    k === 'focallength' ||
    k.includes('focallength') ||
    k === 'flash' ||
    k === 'aperture' ||
    k === 'shutterspeedvalue' ||
    k === 'meteringmode' ||
    k === 'whitebalance'
  ) {
    return {
      group: 'camera',
      sensitive: true,
      label: humanize(key),
      note: 'Camera make/model and settings can help identify the device used.',
    };
  }

  // --- Orientation (special: keeping it preserves how the photo displays) ---
  if (k === 'orientation') {
    return { group: 'orientation', sensitive: false, label: 'Orientation' };
  }

  // --- Embedded thumbnail/preview ---
  if (k.includes('thumbnail') || k.includes('preview')) {
    return {
      group: 'thumbnail',
      sensitive: true,
      label: humanize(key),
      note: 'An embedded preview image can retain the original (un-edited) photo.',
    };
  }

  // --- ICC color profile ---
  if (k.includes('icc') || k.includes('colorprofile') || k === 'profiledescription') {
    return { group: 'icc', sensitive: false, label: humanize(key) };
  }

  // --- IPTC (captions, bylines, copyright, keywords) ---
  if (
    k.includes('byline') ||
    k.includes('caption') ||
    k.includes('headline') ||
    k.includes('keywords') ||
    k.includes('credit') ||
    k.includes('copyright') ||
    k.includes('artist') ||
    k.includes('creator') ||
    k.includes('city') ||
    k.includes('country') ||
    k.includes('sublocation') ||
    k.includes('province')
  ) {
    const placeLike = k.includes('city') || k.includes('country') || k.includes('sublocation') || k.includes('province');
    return {
      group: 'iptc',
      sensitive: true,
      label: humanize(key),
      note: placeLike
        ? 'A named place can disclose where the photo was taken.'
        : 'Authorship/caption text can identify you or your work.',
    };
  }

  // --- Plain descriptive image fields: not sensitive ---
  if (
    k === 'imagewidth' ||
    k === 'imageheight' ||
    k === 'exifimagewidth' ||
    k === 'exifimageheight' ||
    k === 'pixelxdimension' ||
    k === 'pixelydimension' ||
    k === 'colorspace' ||
    k === 'bitspersample' ||
    k === 'compression' ||
    k === 'resolutionunit' ||
    k === 'xresolution' ||
    k === 'yresolution'
  ) {
    return { group: 'image', sensitive: false, label: humanize(key) };
  }

  // XMP namespace-prefixed keys.
  if (k.includes(':')) {
    return { group: 'xmp', sensitive: true, label: humanize(key), note: 'XMP metadata can carry identifying or editing-history data.' };
  }

  // Unknown tag: treat as non-sensitive "other" but still removable.
  return { group: 'other', sensitive: false, label: humanize(key) };
}

/** "GPSLatitude" -> "GPS Latitude", "lensModel" -> "Lens Model". */
export function humanize(key: string): string {
  const cleaned = key.replace(/^.*:/, ''); // drop xmp namespace prefix
  return cleaned
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\bGps\b/gi, 'GPS')
    .replace(/\bId\b/g, 'ID')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}
