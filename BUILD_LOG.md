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
