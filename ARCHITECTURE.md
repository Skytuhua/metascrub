# MetaScrub — Architecture

## Guiding principle

**Everything happens in the browser tab.** No backend, no API, no telemetry. The
file is read into memory, inspected, and rewritten locally; the result is handed
back to the user as a download. This is enforced — not just promised — by a
strict Content-Security-Policy that forbids outbound network connections.

## Tech stack & rationale

| Concern | Choice | Why |
|---|---|---|
| Language | **TypeScript** | Type safety for binary/metadata parsing where mistakes are silent and dangerous. |
| UI framework | **React 19** | Battle-tested, great for the stateful multi-file queue; well-supported tooling. |
| Build tool | **Vite 6** | Fast dev loop; emits a clean, hashed static bundle ideal for any static host. |
| Styling | **Tailwind CSS 3.4** | Maps cleanly onto the design-system tokens (spacing scale, color vars); tiny shipped CSS via purge. |
| Metadata read | **exifr 7** (MIT) | Fast, zero-dep, reads EXIF/GPS/XMP/IPTC/ICC across JPEG/TIFF/PNG/HEIC/AVIF/WebP. |
| Lossless JPEG strip | **piexifjs 1** (MIT) | Edits JPEG APP segments directly — removes EXIF without re-encoding pixels (lossless). |
| PNG/WebP strip | **hand-rolled chunk/segment editor** | Small, auditable, lossless; avoids pulling a heavy dependency for a few-dozen-line task. |
| HEIC decode (optional) | **heic2any** (MIT, lazy-loaded) | Only loaded on demand; decodes HEIC→canvas→clean JPEG. Clearly labelled lossy. |
| Zip (batch download) | **hand-rolled store-only ZIP writer** | A ~100-line stored (no-compression) ZIP writer — images are already compressed, so "store" is correct, and we avoid a dependency. |
| Tests | **Vitest 2** (+ jsdom) | Unit tests for the pure metadata/strip logic; fast. |
| E2E / screenshots | **Playwright** (dev-only) | Drives the built app in a real browser for review evidence. |

### Why React + Vite over alternatives

A lighter stack (vanilla TS / Svelte) would ship a smaller bundle, but the
multi-file queue with per-file async parsing, selective-strip state, and
before/after diffs is genuinely stateful UI where React's model reduces bug
surface. Vite keeps the output a plain static site, so the privacy/auditability
and "works offline" goals are unaffected. Tailwind is purged to only the classes
used, keeping CSS small.

## Module structure

```
src/
  core/                      # Pure, framework-free, fully unit-tested logic
    types.ts                 # MetadataReport, FieldGroup, ScrubOptions, etc.
    detect.ts                # MIME/format detection from magic bytes + ext
    read.ts                  # read all metadata via exifr -> normalized MetadataReport
    sensitivity.ts           # classify fields as sensitive (GPS, serial, software, dates)
    scrub/
      jpeg.ts                # lossless JPEG APP-segment strip (piexifjs + selective)
      png.ts                 # PNG chunk-level metadata strip (lossless)
      webp.ts                # WebP RIFF chunk strip (EXIF/XMP/ICCP) (lossless)
      heic.ts                # HEIC -> clean JPEG (lazy heic2any) — lossy, labelled
      index.ts               # scrub(file, options) dispatcher by format
    gps.ts                   # parse GPS -> {lat,lng}; project to SVG map coords
    zip.ts                   # store-only ZIP writer for batch download
    filename.ts              # name.ext -> name.clean.ext
  ui/                        # React components
    App.tsx
    components/...            # Dropzone, FileQuue, MetadataPanel, GpsMap, ScrubControls, ...
    hooks/...
  styles/index.css           # Tailwind layers + design tokens (CSS variables)
  main.tsx
```

**Data flow:** `File` → `detect()` → `read()` → `MetadataReport` (+ `sensitivity`
classification) → render in `MetadataPanel`/`GpsMap` → user picks `ScrubOptions`
→ `scrub()` dispatches by format → cleaned `Blob` → re-`read()` for the
before/after diff → download (or add to batch zip).

The `core/` layer has **zero** DOM or React imports and is the unit-test target.
The `ui/` layer is the only place the DOM, files, and downloads are touched.

## Security / privacy posture

- **Strict CSP** (set via `<meta>` and documented for host headers):
  `default-src 'self'; connect-src 'none'; img-src 'self' blob: data:;
  script-src 'self'; style-src 'self' 'unsafe-inline'; base-uri 'none';
  form-action 'none'`. `connect-src 'none'` makes any accidental `fetch`/`XHR`
  fail — the app **cannot** phone home even by mistake.
- No third-party fonts loaded over the network (fonts are self-hosted/bundled).
- No analytics, no cookies, no localStorage of image data.
- HEIC decoder WASM is bundled and served from `'self'`, not a CDN.

## Third-party dependencies & licenses

| Package | License | Use |
|---|---|---|
| react / react-dom | MIT | UI |
| vite | MIT | build |
| tailwindcss / postcss / autoprefixer | MIT | styling |
| exifr | MIT | read metadata |
| piexifjs | MIT | lossless JPEG strip |
| heic2any (and bundled libheif) | MIT / (libheif: LGPL-3.0 / MIT dual) | optional HEIC decode |
| vitest / jsdom | MIT | tests |
| playwright | Apache-2.0 | dev-only e2e/screenshots |

All permissively licensed and compatible with shipping MetaScrub under **MIT**.
