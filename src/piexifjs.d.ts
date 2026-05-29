// Minimal ambient types for piexifjs (ships no types of its own).
declare module 'piexifjs' {
  type ExifDict = {
    '0th': Record<number, unknown>;
    Exif: Record<number, unknown>;
    GPS: Record<number, unknown>;
    Interop: Record<number, unknown>;
    '1st': Record<number, unknown>;
    thumbnail: string | null;
  };

  interface TagInfo {
    name: string;
    type: string;
  }

  const piexif: {
    version: string;
    load(data: string): ExifDict;
    dump(exifObj: Partial<ExifDict>): string;
    insert(exifBytes: string, data: string): string;
    remove(data: string): string;
    TAGS: {
      Image: Record<number, TagInfo>;
      Exif: Record<number, TagInfo>;
      GPS: Record<number, TagInfo>;
      Interop: Record<number, TagInfo>;
      [key: string]: Record<number, TagInfo>;
    };
    ImageIFD: Record<string, number>;
    ExifIFD: Record<string, number>;
    GPSIFD: Record<string, number>;
  };

  export default piexif;
}
