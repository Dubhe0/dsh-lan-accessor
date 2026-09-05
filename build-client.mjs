// Build script for dsh-lan-accessor client (esbuild, with __ModuleLoader__.load handshake).
// Run: node build-client.mjs
import { build } from 'esbuild'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(here, 'package.json'), 'utf8'))

const banner = {
  js: "window.__ModuleLoader__.load({ id: 'dsh-lan-accessor', factory: (require) => { var module = { exports: {} }; var exports = module.exports;",
}
const footer = { js: 'return module.exports; } });' }

await build({
  entryPoints: [join(here, 'src/client.jsx')],
  outfile: 'src/client.js',
  bundle: true,
  sourcemap: false,
  logLevel: 'info',
  platform: 'browser',
  format: 'cjs',
  target: ['es2022'],
  jsx: 'automatic',
  external: ['@deepseek-ai/*', 'react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'scheduler'],
  banner,
  footer,
  define: { __WT_VERSION__: JSON.stringify(pkg.version) },
})

console.log('[dsh-lan-accessor build] done: src/client.js')
