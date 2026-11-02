# AGENTS.md

## Git

- Do not commit, amend, or rewrite git history unless the user explicitly requests it in the current turn. Leave changes in the working tree and report them instead.

## Comments

- Keep comments concise and necessary: state the non-obvious reason and nothing more. Omit them when the code already explains itself.
- Explain why, not what, and never narrate history ("previously…", "was changed to…"); git carries that. A long rationale belongs in a doc or the commit message.

## UI components

- Treat `src/components/ui/**` as vendored shadcn/ui code. Do not edit those files to satisfy plugin-specific behavior.
- Customize through call-site props, `className`/`classNames`, wrappers, or plugin CSS instead.
- Exception: when a primitive hard-codes host integration that cannot be reached through its public props (for example a Base UI portal positioner's stacking layer), a minimal local edit is allowed. Add a clear comment explaining the deviation and keep it isolated for future upstream syncs.
- Only update this directory as a deliberate upstream sync (for example with the shadcn CLI), and audit the diff separately.

## UI inspection

- Answer rendered-style questions with `pnpm inspect`, not with a new script. It reports computed styles, matched CSS rules (`--rules`), painted pixels (`--pixels`), screenshots (`--shot`), and can inject CSS for A/B comparisons (`--css`).
- Drive the UI into any state with `--do` before measuring, instead of writing a script for it: `--do today`, `--do view:heatmap`, `--do settings`, `--do 'click:<selector>'`, `--do 'move:x,y'`, `--do wait:ms`, comma-separated. Combine with `--viewport WxH[@DPR]` for asset capture, e.g. `pnpm inspect --do today --viewport 1280x764@2 --shot`.
- The tool is split into `scripts/cdp/session.mjs` (browser + actions), `scripts/cdp/probes.mjs` (measurements) and `scripts/cdp/inspect.mjs` (CLI). Extend a layer instead of adding a script: a new capability is a new action or probe, so future scenarios stay expressible from the command line.
- Only write a throwaway probe when the tool genuinely cannot answer: it is the last resort, not the default. Write one parameterised script and reuse it; never accumulate near-duplicates.

## Dev watch / LiveReload

- Run only one `pnpm dev` (`vite build --watch`) per checkout. It writes `dev/` and serves LiveReload on the default port `35729`.
- Never run `pnpm run build` while watching: its `scripts/clean.js` step deletes `dev/`, `dist/` and `package.zip`. Stop the watcher first; for a dist-only build use `pnpm exec vite build`.
- Keep `dev/` and `dist/` out of commits; they are generated.
- SiYuan desktop serves its window over HTTPS. The injected LiveReload URL must use an explicit `http://127.0.0.1:35729/livereload.js?snipver=1`; a protocol-relative `//...` URL silently fails.
- If auto-reload stops, ensure only one watcher is running with `35729` free, then reload the SiYuan page once. Do not start an extra watcher to force a refresh.
