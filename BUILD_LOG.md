# Build Log

A running, honest journal of decisions, dead ends, and fixes for MetaScrub.

## Phase 0 — Environment & capability setup

- **Toolchain inventory:** Linux x86_64; git 2.43; **Python 3.11.15**; **Node
  v22.22.2**; npm 10.9.7; pnpm/yarn/npx present; `jq`, `curl`, `wget`, `zip`,
  `unzip` present. Missing: `gh` CLI, any browser, `rsync`, ImageMagick.
- **GitHub auth:** No `GH_TOKEN`/`GITHUB_TOKEN` env var present. A personal
  access token was supplied directly for this run; verified it authenticates as
  user **`Skytuhua`** with `repo` + `workflow` scopes via the GitHub REST API.
  **Decision:** publish using the **GitHub REST API via `curl`** (repo create,
  push over HTTPS, release create, asset upload) instead of installing `gh` —
  fewer moving parts, same result. The token is used only from the shell
  environment and is **never** written to a file, echoed, logged, or committed.
- **Git identity:** set globally and per-repo to `Skytuhua
  <Skytuhua@users.noreply.github.com>` so public history shows only the owner.
- **Browser for review:** installed **Playwright + Chromium** in a scratch dir
  (outside the project) and verified a screenshot renders. Ready for Phase 5.
- **Dynamic workflows:** **NOT AVAILABLE in this harness.** Although Claude Code
  reports v2.1.156 (≥ the 2.1.154 cutoff), there is no callable `Workflow` tool
  exposed, and the bundled `/deep-research` skill resolves to a `Workflow({...})`
  call that cannot execute. Per the prompt's fallback directive, this is logged
  here and the work proceeds with **ordinary parallel subagents** (the `Agent`
  tool) plus multi-pass self-review and the bundled `code-review` /
  `security-review` skills. No underlying work is skipped.

## Phase 1 — Discovery & research

- Ran **4 parallel research subagents**, one per candidate (subtitle toolkit,
  EXIF/metadata scrubber, GPX toolkit, cron builder), each gathering real demand
  evidence + incumbent gaps + client-side feasibility with cited sources.
- Scores (demand / incumbent-gap / feasibility): EXIF **4/4/4**, GPX 4/4/4,
  Subtitle 4/3/5, Cron 4/1/5 (saturated).
- **Chose MetaScrub** (EXIF/metadata viewer & scrubber): best honest combo —
  sharpest and most *ethical* wedge (incumbents undermine the privacy they
  promise by uploading files), high-stakes audience, excellent demonstrability,
  fully client-side core. GPX lost because accurate elevation correction needs a
  server/API (cracks the privacy headline); Subtitle lost to a strong free
  incumbent + an existing privacy clone; Cron eliminated as saturated.
- See `RESEARCH.md` for the full write-up.

## Phase 2 — Scaffolding

- Scaffolded **Vite 6 + React 19 + TypeScript** (`npm create vite`).
- Installed pinned deps: `exifr@7.1.3`, `piexifjs@1.0.6`, `heic2any@0.0.4`;
  dev: `tailwindcss@3.4.17`, `postcss@8.4.49`, `autoprefixer@10.4.20`,
  `vitest@2.1.8`, `jsdom@25.0.1`, `@vitest/coverage-v8@2.1.8`.
- Initialised Tailwind (`tailwind.config.js`, `postcss.config.js`).
- Disabled commit signing for this fresh, non-source project
  (`commit.gpgsign=false`) so commits succeed under the owner identity.
- Baseline `vite build` is green.
- Wrote `RESEARCH.md`, `SPEC.md`, `ARCHITECTURE.md`, this log.

## Phase 3.5 — UI/UX design (design-intelligence workflow)

- **Step 1 brief:** product = privacy/security image-metadata scrubber web app;
  industry = privacy/security tooling; audience = privacy-conscious users +
  journalists/activists/survivors + photographers; style keywords = minimal,
  trustworthy, clean, dark, technical, data-focused; stack = `react`.
- **Setup:** ran the design-system generator from a scratch dir outside the
  project and smoke-tested it (prints a recommended design system ✓).
- **Step 2:** generated `design-system/MASTER.md` — engine returned
  **"Shield dark + connected green"**: Flat+Dark style, navy `#1E3A5F` primary,
  green `#22C55E` accent, dark `#0F172A` bg, Lexend+Source Sans 3.
- **Step 2b:** per-page overrides generated for `hero-idle`, `workspace`,
  `metadata-report`.
- **Step 3 domain deep-dives:** ran `--domain style` (flat + OLED dark),
  `--domain color` (full VPN/Privacy token set incl. card/muted-fg — folded in),
  `--domain typography` (Corporate Trust: Lexend/Source Sans 3),
  `--domain ux` (loading-states, stacking-context, continuous-animation
  anti-patterns — folded into Avoid), `--domain landing` (Minimal Single Column).
- **Step 4 stack:** ran `--stack react` (no-useEffect-for-derived-state,
  auto-batch, profile-first) — folded into MASTER "Stack Guidelines".
- **Key privacy decision:** fonts will be **self-hosted** (woff2 + @font-face),
  NOT loaded from Google Fonts CDN, to honor `connect-src 'none'` / no-network.
- **Step 5:** wrote `DESIGN_NOTES.md` (own-words synthesis) — the build contract.
- **Gate 3.5: PASS.**

## Phase 4 — Build

- Built the pure `core/` engine first (types, detect, sensitivity, dimensions,
  read via exifr, GPS projection, store-only ZIP) then lossless scrubbers per
  format (JPEG segment-walker + piexif selective rebuild, PNG/WebP/GIF chunk
  editing) and a lazy browser re-encode path for HEIC/AVIF.
- Built the React UI to the design system: dark-first, dropzone hero, file
  queue, grouped metadata panel (sensitive-first), offline GPS grid map, scrub
  controls (privacy preset / remove-all / custom), batch scrub + zip download,
  light/dark toggle, full keyboard a11y.
- Enforced privacy with a build-only strict CSP (`connect-src 'none'`) and
  self-hosted fonts (no Google CDN).

## Phase 5 — Review & QA

- Ran parallel review subagents (functional, visual/design-system+a11y,
  security/code-quality, robustness/fuzzing) + adversarial cross-checking.
- Caught & fixed (see `REVIEW.md`): a CSP-blocked inline script; PNG/WebP
  metadata-leak on malformed tails; GIF sub-block over-consumption; zip-slip;
  ICC/IHDR field misclassification; dark-mode red + infinite-animation drift.
- Added robustness regression tests. Final: 75 tests pass, lint clean, build
  green, screenshots captured, 0 console errors, 0 outbound network requests.

## Phase 6/7 — Docs, packaging & ship

- Wrote `README.md` (with screenshots + live demo link), `CHANGELOG.md` (v1.0.0),
  `THIRD-PARTY-NOTICES.md`. Produced + verified `metascrub-static.zip` (boots
  from a clean state: 0 external requests, 0 console errors).
- Created public repo **github.com/Skytuhua/metascrub**, pushed `main` (token used
  only via an ephemeral push URL — never persisted to `.git/config` or committed).
- Cut release **v1.0.0** with notes + attached `metascrub-static.zip`
  (download verified: sha256 matches, unzips, index.html present).
- Live demo deployed to **GitHub Pages**: https://skytuhua.github.io/metascrub/
  (Vercel needs interactive CLI login; Pages used instead). Verified live: H1
  renders, **0 external requests** (privacy holds in production), 0 console errors.
- Set repo description, 12 topics, and homepage. All commits authored solely by
  Skytuhua.
