# AGENTS.md

## Development watch / livereload

This repository develops the SiYuan plugin from the generated `dev/` directory; the local workspace links `data/plugins/arco-calendar` to that directory.

- Run **at most one** `pnpm dev` (Vite `build --watch`) process per checkout. Multiple watchers race on the same `dev/` output and on the `rollup-plugin-livereload` port (it searches from `35729` upward), which can leave an already-open SiYuan page connected to a dead port.
- **Never run `pnpm run build` while a watch is active.** Its `scripts/clean.js` step deletes `dev/`, `dist/` and `package.zip`, which removes the watcher's output directory and breaks the SiYuan dev link. Stop the watcher first; if you only need a production `dist/` build without touching `dev/`, run `pnpm exec vite build`.
- After changing code, verify `dev/index.js` was rebuilt. A healthy watch injects a `livereload.js?snipver=1` URL into `dev/index.js`; on Windows check the active watcher with `Get-NetTCPConnection -LocalPort 35729`.
- If auto-reload stops, make sure only one watcher is running and perform a **full page/window reload** of SiYuan once so it reconnects to the current livereload port. Reloading only the plugin is not enough: the injected client early-returns while an old `#livereloadscript` element (possibly pointing at a dead port) is still present. Do not start an extra watcher to force a reload.
- `dev/` and `dist/` are generated and ignored; never edit them manually.
