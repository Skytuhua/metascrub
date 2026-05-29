# Phase 5 — Self-Review & QA

Review was run as **multiple independent angles in parallel** (subagents), with
the binary-parser work cross-checked by two independent reviewers (security and
robustness) that converged on the same critical issue — the adversarial-verifier
pattern. Findings, fixes, and fresh evidence below. Final state: **75 automated
tests pass, lint clean, production build green, zero console errors, zero
outbound network requests.**

## Evidence (screenshots in `review/screenshots/`)

| File | What it shows |
|---|---|
| `01-idle-dark.png` | Idle hero, dark theme — value prop, benefit chips, dropzone |
| `02-idle-light.png` | Idle hero, light theme |
| `03-workspace.png` | Two files queued: a GPS-tagged JPEG (flagged) and a clean PNG ("already clean") |
| `04-metadata-gps.png` | Expanded metadata + the **offline** GPS grid with the location pin |
| `05-scrubbed.png` | After "Scrub all": before→after counts, cleaned-file metadata, batch download |
| `06-mobile-idle.png` / `07-mobile-workspace.png` | Responsive at 375 px |

**Privacy verified empirically:** the Playwright driver logged
`NETWORK_REQUESTS_NONDATA: []` across the full flow (load → inspect → scrub →
download) — not a single request leaves the origin. Console errors: `[]`.

## Pass 1 — Functional
Drove the real built app in Chromium through every state (idle, drag, parse,
ready, already-clean, scrub, done, batch zip, mobile). All flows match `SPEC.md`.

## Pass 2 — Visual / UX + design-system grading
Graded the rendered UI against `design-system/MASTER.md` + the Pre-Delivery
Checklist. Result: 4/6 axes clean pass; color & anti-patterns had minor drift.
Fixes applied:
- **Dark-mode destructive red** was `#F87171` (pinkish) and disagreed with light
  mode — raised to `#EF4444` for legible alarm-red on the dark field; deviation
  from the spec's `#DC2626` documented in `DESIGN_NOTES.md`.
- **GPS pin pulse** was an infinite animation (an "Avoid" item) — made finite
  (3 iterations); already disabled under `prefers-reduced-motion`.
- **"Scrub all"** now shows a spinner + "Scrubbing…" during batch work (no
  silent disabled state).
Checklist re-verified: SVG icons only, cursor/hover/focus/disabled states,
visible green focus ring, contrast ≥4.5:1 both themes, self-hosted fonts,
responsive 375/768/1024/1440, async loading feedback.

## Pass 3 — Edge-case & robustness (adversarial)
Two reviewers fuzzed the byte-level parsers. **No hangs or OOB found** (every
loop provably advances). They found real **metadata-leak / corruption** defects
on malformed input, all now fixed with regression tests
(`src/core/scrub/robustness.test.ts`):
- **PNG / WebP — leak on malformed tail (HIGH):** a metadata chunk whose
  declared length overflowed the buffer was copied verbatim, *leaking the data
  the scrubber promised to remove*. Now: a malformed metadata tail is **discarded
  (fail-safe)**, not copied.
- **GIF — sub-block over-consumption / XMP "magic trailer" (HIGH):** an oversized
  or non-conformant sub-block length could consume following frames. Sub-block
  walking is now **bounded to the buffer**; malformed input fails safe (copy
  remainder, never read OOB, never corrupt).
- **GIF bounds:** added explicit length guards before every descriptor/label read.

## Pass 4 — Code quality
- Deduplicated the repeated `concat()` / `ascii()` helpers into
  `src/core/scrub/bytes.ts`.
- Corrected an overstated "guaranteed empty" comment in `jpeg.ts` (JFIF density
  + Adobe colour-transform segments are intentionally retained as
  non-identifying, render-critical).

## Pass 5 — Security
- **No network paths, no XSS sinks** (all metadata/filenames render as escaped
  JSX text; no `dangerouslySetInnerHTML`); CSP forbids all connections.
- **Zip-slip hardened:** `createZip` now sanitizes entry names (strips `..`,
  leading slashes, drive letters) — `sanitizeName`, with a test.
- **CSP fix:** the inline theme script was blocked by `script-src 'self'` →
  externalized to `public/theme-init.js`; removed `frame-ancestors` from the
  `<meta>` CSP (only valid as a header) and provide it via `_headers`/`vercel.json`.
- Added `Cross-Origin-Opener-Policy` parity to `vercel.json`.
- Added `THIRD-PARTY-NOTICES.md` (OFL fonts + MIT/ISC deps).
- No secrets/tokens in the repo.

## Pass 6 — "Would a real user keep this?"
Yes. The core promise (see exactly what your photo leaks, and remove it without
trusting a server) is delivered: GPS is rendered viscerally on an offline map,
JPEG stripping is lossless, batch + zip work, HEIC is handled honestly, and the
whole thing provably makes zero network calls. It does the one job well.

## Known limitations (honest)
- **TIFF**: metadata is viewable but in-browser stripping isn't supported (no
  lossless TIFF rewrite); flagged in the UI.
- **HEIC/AVIF**: decoded and re-encoded to a clean JPEG/PNG (a format change +
  re-encode, clearly labelled) — browsers can't edit HEIC in place.
- **JPEG with EXIF placed *after* the image scan** (a rare, non-standard
  layout): not stripped, since everything past the start-of-scan is copied
  verbatim to guarantee the pixels are never touched. Normal photos place EXIF
  before the scan and are fully handled.
