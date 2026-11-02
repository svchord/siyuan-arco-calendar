# AGENTS.md

## Git

- Do not commit, amend, or rewrite git history unless the user explicitly requests it in the current turn. Leave changes in the working tree and report them instead.

## Comments

- Concise and necessary: state the non-obvious reason, nothing more. Omit when the code explains itself.
- Why, not what. Never narrate history ("previously…"); git carries that.

## UI components

- `src/components/ui/**` is vendored shadcn/ui. Do not edit it for plugin behavior; customize via call-site props, `className`/`classNames`, wrappers, or plugin CSS.
- Exception: when a primitive hard-codes host integration unreachable through its props, a minimal local edit is allowed. Comment the deviation and keep it isolated for upstream syncs.
- Only touch that directory as a deliberate upstream sync (e.g. the shadcn CLI), and audit the diff separately.

## UI inspection

- Answer rendered-style questions with `pnpm inspect`, never with a new script. It covers computed styles, matched rules (`--rules`), pixels (`--pixels`), screenshots (`--shot`), CSS injection (`--css`), and UI state (`--do`, `--viewport`).
- Extend a layer rather than adding a script: `session.mjs` owns the browser and `--do` actions, `probes.mjs` owns measurements, `inspect.mjs` is the CLI. New scenarios should be expressible from the command line.
- A throwaway probe is the last resort, not the default. If one is unavoidable, write it parameterised and reuse it.

## Dev watch / LiveReload

- Run only one `pnpm dev` (`vite build --watch`) per checkout. It writes `dev/` and serves LiveReload on `35729`.
- Never run `pnpm run build` while watching: its `scripts/clean.js` step deletes `dev/`, `dist/` and `package.zip`. Stop the watcher first; for a dist-only build use `pnpm exec vite build`.
- Keep `dev/` and `dist/` out of commits; they are generated.
- SiYuan desktop serves its window over HTTPS. The injected LiveReload URL must be explicit `http://127.0.0.1:35729/livereload.js?snipver=1`; a protocol-relative `//...` URL silently fails.
- If auto-reload stops, ensure one watcher owns `35729`, then reload the SiYuan page once. Do not start another watcher.
