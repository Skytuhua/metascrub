# Research & Product Selection

> This document records the market research and the reasoning behind choosing
> **MetaScrub** as the product to build. Research was conducted via parallel
> web-research agents (one per candidate), each gathering real demand evidence,
> incumbent gap analysis, and client-side feasibility assessment.

## Method

Four niche, **100% client-side** (browser-only, no backend, privacy-first, no
file upload) web-utility candidates were each researched independently for:

- **(a) Demand** — observable, repeated user pain (forum/Reddit/HN/StackOverflow
  threads, "is there a tool that…" posts, search interest, complaints about
  existing tools).
- **(b) Incumbent weakness** — how clunky / limited / privacy-invasive the
  existing free tools are (is there a real gap?).
- **(c) Client-side feasibility** — can every feature be built purely in-browser
  with no paid API and no data leaving the device?

Each was scored 1–5 on those axes, then weighed against the full selection
rubric (Niche, Real demand, Doable & shippable, Demonstrable, Defensible scope,
Legal/ethical gate).

## Shortlist & Scores

| Candidate | Demand | Incumbent gap | Client-side feasibility | Notes |
|---|:---:|:---:|:---:|---|
| **EXIF / image-metadata viewer & scrubber** ✅ | 4 | **4** | 4 | Sharpest, most ethical wedge |
| GPX / GPS route toolkit | 4 | 4 | 4 | Elevation *correction* needs a server/API |
| Subtitle toolkit | 4 | 3 | 5 | Strong free incumbent + a privacy clone already exists |
| Cron / crontab builder | 4 | **1** | 5 | **Saturated — eliminated** |

### Why each non-winner lost

- **Cron builder — eliminated.** High feasibility but no gap. `crontab.guru`
  (owned by funded company Cronitor) dominates the head term, and
  `cronbuilder.dev` already ships the *entire* proposed spec (GUI + explainer +
  next-N-runs + Quartz + timezone, fully client-side); `systemd.guru` owns the
  systemd-timer corner. A textbook "high-feasibility / no-gap trap."
- **Subtitle toolkit — strong, but runner-up.** Genuine, recurring,
  multi-audience demand (sync drift, framerate mismatch, format conversion,
  bilingual merge). But **Subtitle Edit** is free and excellent (albeit
  Windows-only), and a privacy-first browser clone (`subtitletools.cc`) already
  markets the exact "files never uploaded" angle. The wedge is narrower.
- **GPX toolkit — strong, but the privacy headline cracks.** Merging activities
  (Strava has no native merge) and stripping home-address from exports are loud,
  unsolved pains. But accurate **elevation correction** requires a DEM
  (SRTM tiles are ~25 MB each) — meaning either an external elevation API (so
  coordinates *do* leave the browser) or self-hosted tiles. That asterisk
  undermines a clean "nothing leaves your browser" promise that the *whole
  category* is supposed to stand for.

## Chosen Product: MetaScrub

A **private, in-browser image-metadata viewer and scrubber**. Drop in photos,
see every piece of hidden metadata (EXIF, GPS, IPTC, XMP, thumbnails, camera
make/model, software, timestamps), and strip it — selectively or completely —
**without a single byte ever leaving your device**.

### Target user

1. **Privacy-conscious sharers** — anyone posting photos to forums, marketplaces,
   dating apps, or anywhere images travel as attachments/links (where platforms
   often *don't* strip metadata).
2. **High-stakes users** — journalists, activists, whistleblowers, protected
   witnesses, and people fleeing abusive situations, for whom a GPS tag pointing
   at a new address is a genuine safety risk.
3. **Photographers / sellers** — who want to drop camera serial numbers, GPS, and
   software fingerprints before publishing, losslessly.

### The core problem

Most images carry hidden metadata. People assume platforms strip it — but
behavior is inconsistent (stripped on some upload paths, preserved on "document"
sends, external links, WhatsApp/Telegram/email). The honest fix is to strip
**before** sharing. Yet the dominant online "EXIF removers" **upload your photo
to their server** to do it — which is the exact thing a privacy-minded user is
trying to avoid. Comparison data cited by incumbents themselves claims a large
majority of popular online removers upload files. On Hacker News, a user reacted
to a client-side stripper that still required a login with: *"If it's fully
client-side, why do I need to sign up for an account?"* — a trust gap a clean,
open-source, no-signup tool exploits directly.

### Why incumbents fall short

- **Online removers** mostly **upload your file to a server** (defeating the
  purpose); many add ads, watermarks, signups, or file-size caps.
- **Desktop tools** (ExifCleaner, ExifTool) require installation; ExifTool is a
  CLI most users can't drive; OS built-ins ("Remove Properties", Preview) are
  **incomplete** and offer **no batch**.
- Tools that *do* strip in-browser often re-encode via `<canvas>`, which is
  **lossy** and removes everything indiscriminately — you can't keep orientation
  while dropping GPS, and your pixels are degraded.

### Why this is doable, in demand, and the right pick (one-paragraph pitch)

> Everyone with a phone leaves a GPS trail in their photos, most online "fixers"
> betray the user by uploading the file to strip it, and the people who need this
> most have real safety on the line. MetaScrub is the open-source, no-signup,
> no-ads, **truly local** answer: drag in any image, see exactly what it's
> leaking (with GPS rendered offline on a map so you grasp the risk instantly),
> and remove it — with **lossless** JPEG stripping that preserves your exact
> pixels, selective removal (keep orientation, drop location), and batch
> processing the OS tools lack. Every byte of computation happens in your tab; the
> app even works fully offline. It's buildable today with mature, permissively
> licensed browser libraries (`exifr` to read, `piexifjs` for lossless JPEG
> segment editing), with the one honest limit — HEIC, which browsers can't decode
> natively — handled explicitly and transparently.

### Honest limitations (carried into the spec)

- **HEIC/HEIF** (iPhone default) can't be decoded natively by most browsers.
  MetaScrub reads HEIC metadata and offers an explicit, clearly-labelled
  *decode-to-clean-JPEG* path via a lazy-loaded WASM decoder — this is a format
  change and a re-encode, not an in-place HEIC scrub. Stated plainly in the UI.
- **Canvas re-encoding** is lossy; MetaScrub therefore uses **segment-level
  editing** for JPEG (lossless) and chunk-level editing for PNG/WebP, reserving
  re-encode only for formats/paths where it's unavoidable, and saying so.

### Legal / ethical gate: PASS

MetaScrub only ever processes files the user voluntarily opens, entirely on their
own device, and is designed to *protect* privacy. No data collection, no network
calls for processing, no targeting of individuals. This is a tool I would be
proud to defend publicly.
