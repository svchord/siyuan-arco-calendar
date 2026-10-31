# arco-calendar

[简体中文](README.md) \| English

A calendar panel plugin for SiYuan Note. Open a calendar from the top bar or dock, quickly create or jump to a daily note, and review writing activity in a yearly heatmap.

<img width="1280" alt="preview" src="public/preview.png">

## Modifying Colors

The plugin uses shadcn/Base UI CSS variables, which can be overridden in a theme or code snippet:

```css
.sy-calendar-root,
.sy-calendar-portal,
.sy-calendar-setting,
.sy-calendar-popup {
  /* Primary accent and its foreground */
  --primary: #3575f0;
  --primary-foreground: #ffffff;

  /* Page and card colors */
  --background: var(--b3-menu-background);
  --foreground: var(--b3-theme-on-background);
  --card: var(--b3-menu-background);
  --card-foreground: var(--b3-theme-on-background);

  /* Muted surfaces and text */
  --muted: var(--b3-list-hover);
  --muted-foreground: var(--b3-theme-on-surface);

  /* Borders, inputs, focus */
  --border: var(--b3-border-color);
  --input: var(--b3-border-color);
  --ring: var(--b3-theme-on-surface);

  /* Radius */
  --radius: 0.625rem;
}

/* Dark-mode overrides */
.sy-calendar-root.dark,
.sy-calendar-portal.dark,
.sy-calendar-setting.dark,
.sy-calendar-popup.dark {
  --primary: #8ab4ff;
  --primary-foreground: #171717;
}
```

Main variables:

| Variable                             | Purpose                                   |
| ------------------------------------ | ----------------------------------------- |
| `--primary` / `--primary-foreground` | Today button, selected date, accent color |
| `--background` / `--foreground`      | Panel background and body text            |
| `--card` / `--card-foreground`       | Panel card colors                         |
| `--muted` / `--muted-foreground`     | Week numbers, hints, and muted surfaces   |
| `--border` / `--input`               | Dividers, borders, and input controls     |
| `--ring`                             | Keyboard focus ring                       |
| `--radius`                           | Panel and control radius                  |

## Features

- Three entry positions: top-left, top-right, or dock
- Existing daily notes are highlighted on the month calendar; click any date to open or create it
- Existing notes use a soft disc; days without a note stay plain, and notes with unfinished tasks show an amber corner dot (configurable)
- Month/year dropdowns with a refresh action on the right
- Settings entry in the calendar panel header:
  - Monday or Sunday as the first day of the week
  - Optional week numbers in the calendar gutter
- Refresh icon beside the month/year selectors to reload notebooks and daily notes, with success/failure feedback
- Calendar / Heatmap switch; the yearly heatmap uses content-block counts across all notes: daily-note blocks use the diary date, other notes use each block's creation date, and the year is split into two half-year rows to keep the panel compact
- Heatmap weeks follow the configured week start, with a year selector for browsing other years
- Searchable notebook selector, synchronized with SiYuan's `local-dailynoteid`
- Automatically follows the active SiYuan theme; works on desktop, mobile, and browser frontends

## Tech stack

- **React 19** + TypeScript
- **shadcn/ui** components (Card, Button, Separator, Select, Popover, Command, Calendar) built on Base UI primitives
- **shadcn/ui Vega preset**: neutral palette, Inter font, and Vega component spacing/rounding
- **Tailwind CSS 4**, scoped to the plugin and mapped onto SiYuan theme variables
- **Vite 8** library build; React is bundled with the plugin instead of relying on a host global

## Architecture

```text
src/
├── index.tsx                 # SiYuan plugin lifecycle: onload / onLayoutReady / onunload
├── api/                      # Typed kernel API plus notebook/daily-note queries
├── components/
│   ├── ui/                   # shadcn/ui component sources
│   ├── calendar-app.tsx      # React root with host context
│   ├── calendar-panel.tsx    # Card layout, header, view switch, refresh/settings entry
│   ├── calendar-view.tsx     # Month/year navigation and day markers
│   ├── heatmap-view.tsx      # Yearly heatmap, year picker and legend
│   ├── panel-view-switch.tsx # Calendar/heatmap switch
│   ├── notebook-combobox.tsx # Searchable notebook selector
│   └── position-select.tsx   # Entry-position control
├── hooks/                    # useNotebooks / useDailyNotes / useNoteActivity / useLocale / useIsDark
├── lib/                      # Pure helpers, host context, i18n, storage, icons
├── types/                    # Domain and i18n types
└── ...
```

- React roots are mounted with `createRoot` into the top-bar popup or dock element and unmounted on popup close, dock destroy, and plugin unload.
- Event-bus subscriptions are cleaned up in React effect cleanup functions. Notebook and daily-note changes arriving over `ws-main` refresh the UI incrementally.
- Settings are applied and saved live from the panel popover, without a full page reload.

## Data flow

1. `onload` reads `arco-calendar-entry` settings and registers icons; `onLayoutReady` mounts the top bar or dock.
2. `useNotebooks` fetches the notebook list and `local-dailynoteid` in parallel and builds lightweight notebook objects.
3. `useDailyNotes` queries daily-note attributes for the current/previous/next month and adds unfinished-task state.
4. When the heatmap view opens, `useNoteActivity` counts blocks across all notes: daily-note blocks are attributed to the diary date, while other blocks use their creation date.
5. `useLocale` caches the date-fns locale for the plugin session.
6. A date click opens a mapped document, otherwise the kernel `createDailyNote` API (with its `date` parameter) creates the note; parent paths, template, icon and `custom-dailynote-*` attributes are handled atomically by the kernel.
7. `ws-main` notebook and daily-note events refresh the corresponding data; stale responses are discarded by request sequence.
8. A shared external store manages dark-theme observation across all plugin surfaces.

Components under `src/components/ui` are the shadcn/ui `base-vega` registry distribution. Plugin-specific behavior (existing-note dot, portal layering, plugin icon) lives in app wrappers or primitive compositions rather than edits to those files.

## Development

Requires Node.js >= 24 and pnpm 12.

```bash
pnpm install
pnpm type-check
pnpm test
pnpm build
```

`pnpm build` validates the manifest, runs the type check, builds the production bundle, and creates `package.zip`.

Development (`pnpm dev` keeps watching; run `make-link` in another terminal):

```bash
pnpm dev         # watch build into dev/
pnpm make-link   # link dev/ into the SiYuan workspace plugin directory
```

Creating a directory symlink on Windows requires permission. When unavailable, `pnpm make-link` automatically requests UAC elevation for that link-creation step only:

```bash
pnpm make-link      # Linux / macOS / Windows (requests UAC when needed)
pnpm make-install   # all platforms: build and copy dist/ into the plugin directory (no live reload)
```

If you cancel the UAC prompt, use `pnpm make-install` instead.

Development scripts are Node.js based; the optional Windows elevation step invokes system PowerShell.

You can also set `SIYUAN_PLUGIN_DIR` to `<workspace>/data/plugins` to skip workspace discovery.
`pnpm make-install` replaces the same-named plugin directory; re-enable the plugin in SiYuan afterwards.

## Release

Releases use the community-standard [release-please](https://github.com/googleapis/release-please-action):

1. a push to `main` or a merged PR makes release-please create/update a release PR from Conventional Commits
2. merging that release PR creates the `vX.Y.Z` tag and GitHub Release
3. the workflow checks out the tag, runs `pnpm check` and the production build
4. the generated `package.zip` is uploaded to that release

release-please maintains the version and `CHANGELOG.md`; `public/plugin.json` is kept in sync through `extra-files` in `release-please-config.json`. The `Release` workflow can also be started manually from the Actions page.

## Changelog

[Changelog](./CHANGELOG.md)

## Reference and Thanks

- [BryceAndJuly](https://github.com/BryceAndJuly) for the [first community implementation](https://ld246.com/article/1662969146166)
- [HowcanoeWang/calendar](https://github.com/HowcanoeWang/calendar) for decompilation and feature work on the previous project
- [Jiuyan](https://github.com/leolee9086) for the WebSocket wrapper template

## License

[License](./LICENSE)
