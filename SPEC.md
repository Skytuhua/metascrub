# MetaScrub — Product Spec (v1)

**One-liner:** A private, in-browser image-metadata viewer and scrubber. Nothing
is ever uploaded.

## Goal

Let a user open one or more images, instantly understand the hidden metadata they
carry (especially GPS/location), and remove it — selectively or completely — with
the cleaned files saved back to their device, all **100% client-side**.

## v1 Feature Set

### F1 — Load images (no upload)
- Drag-and-drop one or many files onto a dropzone.
- Click-to-browse file picker (`<input type=file multiple>`).
- Paste from clipboard (`Ctrl/Cmd+V` of an image).
- Accept JPEG/JPG, PNG, WebP, TIFF, GIF, AVIF, HEIC/HEIF.
- All reads via `FileReader`/`ArrayBuffer`; **no network request is made with the
  file** — verifiable in DevTools (and asserted by tests/CSP).

### F2 — View metadata
- For each image show a structured, readable breakdown of all detected metadata:
  EXIF (camera make/model, lens, exposure, ISO, software, dates), GPS
  (lat/long/altitude), IPTC, XMP, ICC profile presence, embedded thumbnail
  presence, image dimensions, file size, MIME type.
- **Privacy highlighting:** GPS / location / device-serial / software fields are
  flagged as "sensitive" with a clear visual marker and a short plain-English
  explanation of the risk.
- **GPS preview, offline:** if GPS coordinates exist, render their position on a
  small **fully offline** map (inline SVG world map with a plotted pin) plus the
  exact coordinates and a copy button. An explicit, user-initiated "Open in
  OpenStreetMap ↗" link is offered (opens a new tab only when clicked) — no map
  tiles are fetched automatically.
- A clear **"No metadata found / already clean"** state.

### F3 — Scrub metadata
- **Strip all:** remove all metadata.
- **Selective strip:** choose which groups to remove (e.g. remove GPS but keep
  Orientation, or remove everything except color profile). Sensible privacy
  preset: "Remove GPS + device identifiers, keep orientation & color."
- **Lossless for JPEG:** strip via EXIF/APP-segment editing (`piexifjs` /
  segment-level manipulation) so pixels are **byte-for-byte preserved**.
- **PNG/WebP:** strip metadata chunks (tEXt/zTXt/iTXt/eXIf/`XMP`/`EXIF`) by
  chunk-level rewriting (lossless).
- **HEIC/HEIF:** read metadata; offer explicit *decode → clean JPEG* path
  (clearly labelled as a lossy re-encode + format change), lazy-loaded.
- Show a **before → after** metadata diff and the new file size.

### F4 — Save (no upload)
- Download each cleaned image (`Blob` + object URL), preserving a sensible
  filename (`photo.jpg` → `photo.clean.jpg`).
- **Batch:** "Download all" produces a single `.zip` of all cleaned images
  (built client-side).

### F5 — Batch processing
- Operate on many images at once: a queue/list with per-file status (read →
  ready → scrubbed), per-file metadata, and a one-click "scrub all".

### F6 — UX & polish
- Real states: empty/idle, loading/parsing, success, "already clean", error
  (corrupt/unsupported file).
- Responsive (mobile 375px → desktop 1440px).
- Fully keyboard-accessible; visible focus; ≥4.5:1 contrast; `prefers-reduced-motion`.
- A persistent, honest **"Your photos never leave your device"** assurance, plus
  a short "How it works" explainer.
- Works **offline** (installable PWA / opens from `file://` after build).

## Non-Goals (explicitly out of scope for v1)

- ❌ No accounts, login, server, database, or analytics of any kind.
- ❌ No image editing (crop/filter/resize) — metadata only.
- ❌ No auto-transcription, AI, or any feature needing a remote API.
- ❌ No live HEIC *in-place* rewrite (browsers can't; we convert to clean JPEG).
- ❌ No RAW (CR2/NEF/ARW) scrubbing (read-only metadata at most; flagged unsupported for strip).
- ❌ No automatic reverse-geocoding or map-tile fetching (would leak coordinates).

## Primary User Flows

1. **Quick scrub (single):** drop photo → see "⚠ GPS: 37.81, -122.47" on offline
   map → click "Remove all metadata" → see "after: clean" → download
   `photo.clean.jpg`.
2. **Selective:** drop photo → open "Advanced" → uncheck "Orientation" so it's
   kept → "Scrub selected" → download.
3. **Batch:** drop a folder of 30 photos → review the list → "Scrub all" →
   "Download all (.zip)".
4. **Audit only:** drop photo → read full metadata → close without changing
   (pure viewer).

## Definition of "Done" (success criteria)

- [ ] All of F1–F6 implemented and working for real on JPEG, PNG, WebP (read+strip),
      with HEIC read + decode-to-clean-JPEG, and graceful handling of TIFF/GIF/AVIF.
- [ ] JPEG strip verified **lossless** (pixel data identical pre/post) by an
      automated test.
- [ ] Stripped output verified to contain **no** residual EXIF/GPS by an
      automated test (re-parse → assert empty).
- [ ] Zero network requests occur during load/scrub/save (verified manually in
      DevTools + enforced by a strict CSP that forbids outbound connections).
- [ ] Automated tests cover the core parse/strip/selective logic and pass.
- [ ] Polished, responsive, accessible UI faithful to the design system.
- [ ] Build artifacts (static bundle + zip) produced and verified from clean state.
