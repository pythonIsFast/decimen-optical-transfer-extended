# Build & release

## Scripts

```bash
npm run dev               # https dev server with HMR (self-signed cert)
npm run serve             # build, then serve the production bundle
npm run diagnostics       # dev server + per-transfer run reports — see diagnostics.md
npm test                  # golden wire-format vectors and unit tests (node --test via tsx)
npm run build             # typecheck (app + node configs), hosted site → dist/
npm run build:standalone  # both self-contained pages → dist-standalone/
npm run build:all         # everything
npm run icons             # regenerate public/ icons from the logo (needs librsvg)
```

`npm run icons` strips the logo SVG's comments before rasterizing (a `--` inside a comment is invalid XML that browsers tolerate but librsvg rejects) and does exact-match surgery on the markup, throwing if the logo changes shape.

`VITE_SITE_URL` overrides the published URL baked into social cards and the share dialogs (default `https://pythonisfast.github.io/decimen-optical-transfer-extended/`). A trailing slash is added if missing. `pages.yml` passes the deployment's own URL, so a Pages build never advertises somebody else's site.

## PWA / service worker

`vite-plugin-pwa` (workbox) precaches everything including the 940 KB decoder wasm. Two pieces are custom (`build/root-pwa-head.ts`): manifest/SW references are rewritten to resolve to the site root from any page depth (the build validates this), and the registration script does the skip-waiting handshake — a new deploy takes over open pages with a single reload instead of serving the stale precache forever. A workbox `rangeRequests` route serves received media from the Cache API (see [Platform quirks](platform-quirks.md)).

## CI (`.github/workflows`)

- **`ci.yml`** — tests and builds on every push to `main` / `release/*` and every PR. Asserts the served `receive` chunk stays under 20 KB (catches the inlined worker/wasm leaking into the site build) and that manifest/SW references point at files that exist.
- **`pages.yml`** — deploys to GitHub Pages on every push to `main`.

The site builds with `base: "./"`, so it works under a project subpath with no configuration.

## Versioning

Bump the version with `npm version X.Y.Z --no-git-tag-version` and commit. This
fork publishes no release artifacts; `npm run build:all` produces the site and
both standalone files locally.

The footer stamps `v<version> · build <short-hash>` (`-dirty` when uncommitted work is in the build), so any artifact names its exact source.
