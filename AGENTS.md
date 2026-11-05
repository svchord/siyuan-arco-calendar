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

- Answer rendered-style questions with `pnpm measure` (tokens, computed styles, hit counts, box sizes, contrast) or `pnpm shot` (headless desktop/mobile screenshots), never with a new script.
- Interaction and layout states need real events: `--do hover:...`, `--setup contextmenu:...`. `pnpm measure --help` lists every subcommand.
- A throwaway probe is the last resort, not the default.

## Dev watch

- Run only one `pnpm dev` (`vite build --watch`) per checkout; it writes `dev/`.
- The devkit Vite plugin links `dev/` into the SiYuan plugin directory when the session starts. A plugin directory must be a real symlink — SiYuan's Go runtime does not accept a junction — so on Windows devkit requests UAC once when the privilege is missing; refusing it aborts the session rather than falling back to a copy.
- Any artifact change makes devkit broadcast `/api/ui/reloadUI` (full-page refresh): SiYuan re-runs startup, so both `index.js` and `index.css` pick up the new files. Your own SiYuan window refreshes too (loses cursor/scroll/open panels) — this is an explicit tradeoff. Resident headless measurement pages are off by default (`auditBrowser: false`) to save memory; enable `siyuanPlugin({ auditBrowser: true })` if an agent needs `measure --attach`. A read lease blocks measurement while refresh is in flight, and `--attach` reports an error if it cannot connect.
- Stop the watcher before `pnpm run build`: both builds run `tsc --build --force` over the same `node_modules/.tmp/*.tsbuildinfo`, so running them at once races on that state.
- `dev/` and `dist/` are generated; keep them out of commits.
