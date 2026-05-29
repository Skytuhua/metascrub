import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// The privacy guarantee made enforceable: a strict CSP that forbids ALL
// outbound connections (`connect-src 'none'`). Injected only into the production
// build so the dev server's HMR websocket keeps working.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self' data:",
  "connect-src 'none'",
  "worker-src 'self' blob:",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
  // Note: `frame-ancestors` only works as an HTTP header (ignored in <meta>),
  // so it's documented for host config rather than set here.
].join('; ')

function cspPlugin(): Plugin {
  return {
    name: 'metascrub-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '</title>',
        `</title>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      )
    },
  }
}

// `base: './'` makes the built bundle work from any sub-path or directly off the
// filesystem (file://) — important for "works fully offline" and Pages sites.
export default defineConfig({
  base: './',
  plugins: [react(), cspPlugin()],
})
