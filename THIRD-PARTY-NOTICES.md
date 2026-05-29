# Third-Party Notices

MetaScrub bundles the following third-party components. Their licenses are
reproduced or referenced below as required.

## Fonts (SIL Open Font License 1.1)

- **Lexend** — © The Lexend Project Authors. Licensed under the SIL Open Font
  License, Version 1.1. Bundled via the `@fontsource/lexend` package.
- **Source Sans 3** — © Adobe (Source Foundry). Licensed under the SIL Open Font
  License, Version 1.1. Bundled via the `@fontsource/source-sans-3` package.

The full OFL-1.1 text is distributed inside each `@fontsource/*` package
(`node_modules/@fontsource/<name>/LICENSE`) and is available at
<https://openfontlicense.org>. The Reserved Font Names "Lexend" and "Source"
are not used by MetaScrub for any modified versions.

## JavaScript dependencies

| Package | License |
|---|---|
| react, react-dom | MIT |
| vite, @vitejs/plugin-react | MIT |
| tailwindcss, postcss, autoprefixer | MIT |
| exifr | MIT |
| piexifjs | MIT |
| heic2any (bundles libheif) | MIT (libheif: dual MIT / LGPL-3.0) |
| lucide-react | ISC |
| vitest, jsdom | MIT |

All of the above are permissive licenses compatible with MetaScrub's own MIT
license. No third-party source files are vendored into this repository; these
components are pulled from npm at build time.
