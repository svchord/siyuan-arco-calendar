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

- Answer rendered-style questions with `siyuan-devtools` (`read env` / `read tokens` / `read element` / `read contrast`) or `pnpm shot` (headless desktop/mobile screenshots), never with a new script.
- `siyuan-devtools` keeps one resident browser session. Run `pnpm open` once; every later command reuses the same page. Do not `open` again — it kills the old Chrome.
- Interaction and layout states need real events: `do hover ...`, `do menu ...`. Elements such as menu items are absent from the DOM until opened. `siyuan-devtools --help` lists every command.
- After editing sources, wait for `[vite-plugin-siyuan] build #N ready`, then `siyuan-devtools reload` before measuring.
- A throwaway probe is the last resort, not the default.

## Dev watch

- Run only one `pnpm dev` (`vite build --watch`) per checkout; it writes `dev/`.
- The `vite-plugin-siyuan` Vite plugin links `dev/` into the SiYuan plugin directory when the session starts. A plugin directory must be a real symlink — SiYuan's Go runtime does not accept a junction — so on Windows the plugin requests UAC once when the privilege is missing; refusing it aborts the session rather than falling back to a copy.
- Any artifact change makes the plugin broadcast `/api/ui/reloadUI` (full-page refresh): SiYuan re-runs startup, so both `index.js` and `index.css` pick up the new files. Your own SiYuan window refreshes too (loses cursor/scroll/open panels) — this is an explicit tradeoff.
- Stop the watcher before `pnpm run build`: both builds run `tsc --build --force` over the same `node_modules/.tmp/*.tsbuildinfo`, so running them at once races on that state.
- `dev/` and `dist/` are generated; keep them out of commits.
