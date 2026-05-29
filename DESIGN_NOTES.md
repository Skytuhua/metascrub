# MetaScrub — Design Notes

My own-words synthesis of the design system (full system + binding tokens live in
`design-system/MASTER.md` and `design-system/pages/*.md`). Phase 4 builds to this.

## The feeling

A calm, credible **security instrument** — closer to a password manager or VPN
client than a flashy SaaS landing page. It should feel quiet, exact, and
trustworthy the instant it loads. Dark by default (the "shield" backdrop), with a
single confident green that means **safe / private / cleaned**. Nothing shouts;
the data does the talking.

## Pattern & layout

- **Minimal single column**, generous whitespace, mobile-first. The **dropzone is
  the hero CTA** — when the app is idle it's centered and large with a one-line
  promise and three benefit bullets (*Nothing is uploaded* · *Lossless* · *Batch*).
- Once files are loaded it becomes a **workspace**: a left/top file queue and a
  detail panel per file (metadata + GPS + scrub controls). On mobile these stack.
- A slim footer states how it works and links to the source. No nav clutter.

## Color (dark-first, binding hex)

- Background `#0F172A`, cards `#192134`, muted panels `#10192E`, hairline borders
  `rgba(255,255,255,.08)` — no shadows, separation by border and spacing only.
- Text white `#FFFFFF`; secondary text muted slate `#94A3B8`.
- **Accent green `#22C55E`** = the safe/clean signal: the primary "Scrub" button,
  the "clean ✓" badge, the focus ring. Used sparingly — one accent.
- Primary navy `#1E3A5F` for secondary surfaces/headers.
- **Sensitive signalling:** GPS / device serial / software / precise timestamps
  are flagged with **amber `#F59E0B`** ("present, review this") escalating to
  **red `#DC2626`** for location specifically. This is the emotional core of the
  UI — make the leak *visible* before offering to remove it.
- Light mode mirrors the same roles on `#F8FAFC` / white cards for users who want it.

## Type

- **Lexend** headings (chosen for readability/accessibility), **Source Sans 3**
  body, **monospace** for raw values and coordinates.
- **Self-hosted** woff2 only — no Google Fonts CDN call (it would break the
  privacy promise and the CSP). System-font fallback so it never blocks.

## Spacing & shape

- 4px base scale (Tailwind default): 4 / 8 / 12 / 16 / 24 / 32 / 48. Cards padded
  16–24px. Comfortable line-height for the dense metadata lists.
- `border-radius` 8–12px on cards/buttons; flat, no gradients.

## Motion

- 150–200ms ease on hover/focus/state changes. One small celebratory "scrubbed"
  checkmark transition. **No** infinite decorative animation; `animate-spin` only
  on genuine loaders/skeletons. Everything disabled under `prefers-reduced-motion`.

## States I must build (no placeholders)

Idle/empty · drag-over (dropzone lights green) · parsing (skeleton) · ready
(metadata shown) · **already clean** (reassuring, not an error) · scrubbing
(progress) · scrubbed (before→after diff + download) · error
(corrupt/unsupported, with a clear message) · HEIC notice (explains the lossy
decode-to-JPEG path).

## Anti-patterns to avoid (graded in review)

No emoji icons (SVG only) · no unstructured metadata wall (group it, lead with
sensitive, collapse raw detail) · no ads/dark-patterns/fake-urgency · no frozen
UI during async · no z-index hacks · keep contrast ≥4.5:1 both modes · visible
keyboard focus everywhere.

## Accessibility contract

Full keyboard operability (dropzone reachable + activatable, all controls
focusable in order), visible green focus ring, semantic landmarks/labels,
contrast ≥4.5:1, `prefers-reduced-motion`, responsive at 375/768/1024/1440.
