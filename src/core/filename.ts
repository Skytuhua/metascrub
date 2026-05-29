/**
 * Turn an input filename into the cleaned-output filename.
 *
 * `photo.jpg`        -> `photo.clean.jpg`
 * `IMG_001.JPEG`     -> `IMG_001.clean.jpeg`   (extension lower-cased)
 * `archive.tar.gz`   -> `archive.tar.clean.gz` (only the final extension splits)
 * `noext`            -> `noext.clean`
 * `.hidden`          -> `.hidden.clean`        (leading-dot dotfiles keep their name)
 *
 * When the format changes (e.g. HEIC decoded to JPEG) pass `forceExt` to set the
 * new extension: `cleanName('IMG.heic', 'jpg')` -> `IMG.clean.jpg`.
 */
export function cleanName(original: string, forceExt?: string): string {
  const name = original.trim() || 'image';
  const lastDot = name.lastIndexOf('.');

  // No extension, or a leading-dot dotfile with no other dot (".hidden").
  if (lastDot <= 0) {
    return forceExt ? `${name}.clean.${normalizeExt(forceExt)}` : `${name}.clean`;
  }

  const base = name.slice(0, lastDot);
  const ext = forceExt ? normalizeExt(forceExt) : name.slice(lastDot + 1).toLowerCase();
  return `${base}.clean.${ext}`;
}

function normalizeExt(ext: string): string {
  return ext.replace(/^\.+/, '').toLowerCase();
}
