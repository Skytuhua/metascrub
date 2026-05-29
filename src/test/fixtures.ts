/**
 * Test fixtures: build small, structurally-valid image files that carry real
 * metadata, so the scrub logic can be exercised end-to-end without external
 * binaries. These files are not meant to be visually decoded — they exercise
 * the metadata container structure that MetaScrub edits.
 */
import piexif from 'piexifjs';
import { binaryToBytes, bytesToBinary } from '../core/scrub/jpeg-util';
import { crc32 } from '../core/zip';

export function bytes(...arr: number[]): Uint8Array {
  return Uint8Array.from(arr);
}

export function enc(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
}

export function concat(parts: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

// ---------------------------------------------------------------- JPEG ------

/** A JPEG marker segment: FF <marker> <len:2> <payload>. */
function jpegSeg(marker: number, payload: Uint8Array): Uint8Array {
  const len = payload.length + 2;
  return concat([bytes(0xff, marker, (len >> 8) & 0xff, len & 0xff), payload]);
}

/** A realistic EXIF object (with GPS, camera, software, orientation). */
function sampleExifObject() {
  return {
    '0th': {
      271: 'TestMake', // Make
      272: 'TestModel', // Model
      274: 6, // Orientation
      305: 'SecretCameraApp v9', // Software
      306: '2021:06:01 09:41:00', // DateTime
    },
    Exif: {
      36867: '2021:06:01 09:41:00', // DateTimeOriginal
      33434: [1, 200], // ExposureTime
      33437: [28, 10], // FNumber
      34855: 100, // ISO
      37386: [50, 1], // FocalLength
      42036: 'TestLens 50mm', // LensModel
      42033: 'BODY-SN-12345', // BodySerialNumber
    },
    GPS: {
      1: 'N',
      2: [[37, 1], [48, 1], [0, 1]], // 37°48'00" = 37.8
      3: 'W',
      4: [[122, 1], [28, 1], [0, 1]], // 122°28'00" W = -122.4667
    },
    Interop: {},
    '1st': {},
    thumbnail: null,
  };
}

/** The non-metadata tail of our test JPEG (SOF0 + SOS + scan + EOI). */
export function jpegImageTail(): Uint8Array {
  const sof0 = jpegSeg(0xc0, bytes(0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00));
  const sos = jpegSeg(0xda, bytes(0x01, 0x01, 0x00, 0x00, 0x3f, 0x00));
  const scan = bytes(0xaa, 0xbb, 0x12, 0x34, 0x7e, 0x10); // dummy entropy (no 0xFF)
  const eoi = bytes(0xff, 0xd9);
  return concat([sof0, sos, scan, eoi]);
}

export interface JpegFixtureOpts {
  exif?: boolean;
  xmp?: boolean;
  icc?: boolean;
  iptc?: boolean;
  comment?: boolean;
}

/** Build a JPEG with the requested metadata segments before the image data. */
export function buildJpeg(opts: JpegFixtureOpts = { exif: true, xmp: true, icc: true, iptc: true, comment: true }): Uint8Array {
  const soi = bytes(0xff, 0xd8);
  const segs: Uint8Array[] = [];
  // Non-EXIF metadata segments are hand-built (valid FFEn APP segments).
  if (opts.xmp) segs.push(jpegSeg(0xe1, concat([enc('http://ns.adobe.com/xap/1.0/\0'), enc('<x:xmpmeta>secret author</x:xmpmeta>')])));
  if (opts.icc) segs.push(jpegSeg(0xe2, concat([enc('ICC_PROFILE\0'), bytes(0x01, 0x01), enc('dummyiccprofiledata')])));
  if (opts.iptc) segs.push(jpegSeg(0xed, concat([enc('Photoshop 3.0\0'), enc('8BIM-byline-John Doe')])));
  if (opts.comment) segs.push(jpegSeg(0xfe, enc('Created with SecretApp build 1234')));
  let jpeg = concat([soi, ...segs, jpegImageTail()]);
  // EXIF is inserted with piexif so it's a real, valid APP1 Exif segment.
  if (opts.exif) {
    const exifBytes = piexif.dump(sampleExifObject());
    jpeg = binaryToBytes(piexif.insert(exifBytes, bytesToBinary(jpeg)));
  }
  return jpeg;
}

/** List the marker bytes that appear in a JPEG's header (before SOS). */
export function jpegMarkers(b: Uint8Array): number[] {
  const markers: number[] = [];
  let i = 2;
  while (i + 1 < b.length) {
    if (b[i] !== 0xff) break;
    const m = b[i + 1];
    markers.push(m);
    if (m === 0xda || m === 0xd9) break;
    if (m === 0x01 || (m >= 0xd0 && m <= 0xd7)) {
      i += 2;
      continue;
    }
    const len = (b[i + 2] << 8) | b[i + 3];
    i += 2 + len;
  }
  return markers;
}

// ----------------------------------------------------------------- PNG ------

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const td = concat([enc(type), data]);
  const out = new Uint8Array(4 + td.length + 4);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  out.set(td, 4);
  dv.setUint32(4 + td.length, crc32(td));
  return out;
}

export function buildPng(): Uint8Array {
  const sig = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  const ihdrData = bytes(0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0); // 1x1 RGB
  return concat([
    sig,
    pngChunk('IHDR', ihdrData),
    pngChunk('eXIf', concat([bytes(0x49, 0x49, 0x2a, 0x00), enc('fakeexif')])),
    pngChunk('tEXt', enc('Author\0Jane Secret')),
    pngChunk('zTXt', enc('Comment\0\0zdata')),
    pngChunk('iTXt', enc('XML:com.adobe.xmp\0\0\0\0\0<xmp>secret</xmp>')),
    pngChunk('iCCP', concat([enc('icc\0\0'), enc('iccdata')])),
    pngChunk('tIME', bytes(0x07, 0xe5, 6, 1, 9, 41, 0)),
    pngChunk('IDAT', enc('fakeimagedata')),
    pngChunk('IEND', new Uint8Array(0)),
  ]);
}

/** A PNG with no metadata chunks — only intrinsic image data. */
export function buildCleanPng(): Uint8Array {
  const sig = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  const ihdrData = bytes(0, 0, 0, 2, 0, 0, 0, 2, 8, 2, 0, 0, 0); // 2x2 RGB
  return concat([sig, pngChunk('IHDR', ihdrData), pngChunk('IDAT', enc('imgdata')), pngChunk('IEND', new Uint8Array(0))]);
}

export function pngChunkTypes(b: Uint8Array): string[] {
  const types: string[] = [];
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let i = 8;
  while (i + 8 <= b.length) {
    const len = dv.getUint32(i);
    let t = '';
    for (let j = 0; j < 4; j++) t += String.fromCharCode(b[i + 4 + j]);
    types.push(t);
    i += 12 + len;
    if (t === 'IEND') break;
  }
  return types;
}

// ---------------------------------------------------------------- WebP ------

function webpChunk(fourcc: string, data: Uint8Array): Uint8Array {
  const padded = data.length + (data.length % 2);
  const out = new Uint8Array(8 + padded);
  out.set(enc(fourcc), 0);
  new DataView(out.buffer).setUint32(4, data.length, true);
  out.set(data, 8);
  return out;
}

export function buildWebp(): Uint8Array {
  // VP8X with ICC(0x20)|EXIF(0x08)|XMP(0x04) flags set = 0x2C.
  const vp8xData = bytes(0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  const body = concat([
    webpChunk('VP8X', vp8xData),
    webpChunk('ICCP', enc('iccprofiledata')),
    webpChunk('VP8 ', enc('fakeimagebitstreamdata')),
    webpChunk('EXIF', concat([bytes(0x49, 0x49, 0x2a, 0x00), enc('fakeexif')])),
    webpChunk('XMP ', enc('<x:xmpmeta>secret</x:xmpmeta>')),
  ]);
  const out = new Uint8Array(12 + body.length);
  out.set(enc('RIFF'), 0);
  new DataView(out.buffer).setUint32(4, 4 + body.length, true);
  out.set(enc('WEBP'), 8);
  out.set(body, 12);
  return out;
}

export function webpFourccs(b: Uint8Array): string[] {
  const list: string[] = [];
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let i = 12;
  while (i + 8 <= b.length) {
    let f = '';
    for (let j = 0; j < 4; j++) f += String.fromCharCode(b[i + j]);
    const size = dv.getUint32(i + 4, true);
    list.push(f);
    i += 8 + size + (size % 2);
  }
  return list;
}

export function webpVp8xFlags(b: Uint8Array): number {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let i = 12;
  while (i + 8 <= b.length) {
    let f = '';
    for (let j = 0; j < 4; j++) f += String.fromCharCode(b[i + j]);
    const size = dv.getUint32(i + 4, true);
    if (f === 'VP8X') return b[i + 8];
    i += 8 + size + (size % 2);
  }
  return -1;
}

// ----------------------------------------------------------------- GIF ------

function gifSubBlock(data: Uint8Array): Uint8Array {
  return concat([bytes(data.length), data, bytes(0x00)]);
}

export function buildGif(): Uint8Array {
  const header = enc('GIF89a');
  const lsd = bytes(1, 0, 1, 0, 0x00, 0, 0); // 1x1, no global color table
  const comment = concat([bytes(0x21, 0xfe), gifSubBlock(enc('secret comment'))]);
  const xmpApp = concat([bytes(0x21, 0xff, 0x0b), enc('XMP DataXMP'), gifSubBlock(enc('<x:xmpmeta/>'))]);
  const netscape = concat([bytes(0x21, 0xff, 0x0b), enc('NETSCAPE2.0'), bytes(0x03, 0x01, 0x00, 0x00), bytes(0x00)]);
  const image = concat([
    bytes(0x2c, 0, 0, 0, 0, 1, 0, 1, 0, 0x00), // descriptor: 1x1, no LCT
    bytes(0x02), // LZW min code size
    gifSubBlock(bytes(0x44, 0x01)), // fake image data
  ]);
  const trailer = bytes(0x3b);
  return concat([header, lsd, comment, xmpApp, netscape, image, trailer]);
}

/** List GIF blocks as tags: 'comment', 'xmp', 'netscape', 'image', 'gce', 'trailer'. */
export function gifBlocks(b: Uint8Array): string[] {
  const list: string[] = [];
  let i = 13; // header(6)+lsd(7), no GCT in our fixture
  const skipSub = (j: number) => {
    while (j < b.length) {
      const len = b[j];
      j++;
      if (len === 0) break;
      j += len;
    }
    return j;
  };
  while (i < b.length) {
    const block = b[i];
    if (block === 0x3b) {
      list.push('trailer');
      break;
    }
    if (block === 0x2c) {
      list.push('image');
      i += 10;
      i += 1; // min code size
      i = skipSub(i);
      continue;
    }
    if (block === 0x21) {
      const label = b[i + 1];
      const end = skipSub(i + 2);
      if (label === 0xfe) list.push('comment');
      else if (label === 0xf9) list.push('gce');
      else if (label === 0xff) {
        const appId = String.fromCharCode(...b.subarray(i + 3, i + 11));
        if (appId === 'XMP Data') list.push('xmp');
        else if (appId === 'NETSCAPE') list.push('netscape');
        else list.push('app');
      }
      i = end;
      continue;
    }
    break;
  }
  return list;
}
