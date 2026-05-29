# Changelog

All notable changes to MetaScrub are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/), and this project adheres to
[Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-05-29

First public release.

### Added
- **Metadata viewer** — reads EXIF, GPS, IPTC, XMP, ICC, embedded thumbnails,
  camera settings and dimensions for JPEG, PNG, WebP, GIF, HEIC/HEIF, AVIF and
  TIFF; groups fields and flags privacy-sensitive ones first.
- **Offline GPS preview** — plots embedded coordinates on a bundled
  coordinate-grid map with no map-tile requests; a user-initiated link opens the
  precise map in a new tab.
- **Lossless scrubbing** for JPEG (segment-level + selective EXIF rebuild), PNG,
  WebP and GIF (chunk/block-level) — image pixel data is never re-encoded.
- **HEIC/AVIF cleaning** via an on-demand WASM decode to a clean JPEG/PNG
  (labelled as a re-encode + format change).
- **Scrub presets** — Privacy preset, Remove everything, and a custom per-group
  selection (GPS, device IDs, date/time, software, camera, author/IPTC, XMP,
  thumbnail, colour profile, orientation).
- **Batch** processing with **Download all (.zip)** via a dependency-free,
  zip-slip-safe ZIP writer.
- **Privacy by construction** — strict CSP (`connect-src 'none'`), self-hosted
  fonts, no analytics/accounts/cookies; recommended security headers shipped for
  static hosts and Vercel.
- **UX** — dark/light themes, responsive (375–1440 px), full keyboard
  accessibility, real loading/empty/error/already-clean states.
- Test suite of 75 unit + robustness tests; the parsers fail safe on malformed
  input (never leak metadata, never read out of bounds, never hang).

[1.0.0]: https://github.com/Skytuhua/metascrub/releases/tag/v1.0.0
