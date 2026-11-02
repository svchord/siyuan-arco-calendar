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

By default `--primary` falls back to the Vega neutral palette. With the "use theme color" setting enabled, the plugin publishes `--arco-calendar-accent` / `--arco-calendar-accent-foreground` on `<html>` and those take over `--primary`, so emphasis surfaces follow the SiYuan accent. Override the two variables above to pin a fixed palette instead.

## Features

- Three entry positions: top-left, top-right, or dock
- Existing daily notes are highlighted on the month calendar; click any date to open or create it
- Existing notes use a soft accent-tinted disc; days without a note stay plain, and notes with unfinished tasks show an amber corner dot
- Today carries a small dot under the date, which switches to the contrast colour once selected so it never blends into the chip
- Month/year dropdowns with a refresh action, plus a settings entry in the panel header
- Settings: entry position, week start, week numbers, unfinished-task markers, and use-theme-color
- "Use theme color" switches the selected date, buttons, note disc and heatmap to the SiYuan accent; with it off the Vega neutral palette is used
- Calendar / Heatmap switch; the yearly heatmap counts content blocks across all notes, attributing daily-note blocks to the diary date and other blocks to their creation date
- Heatmap weeks follow the configured week start, with a year selector; hovering a cell shows that day's block count, clicking opens or creates that day's daily note, and the footer shows the yearly total
- Searchable notebook selector, synchronized with SiYuan's `local-dailynoteid`
- Automatically follows the active SiYuan theme; works on desktop, mobile, and browser frontends

## Tech stack

- **React 19** + TypeScript
- **shadcn/ui** (Vega preset) with Base UI primitives
- **Tailwind CSS 4**, scoped to the plugin and mapped onto SiYuan theme variables
- **Vite 8** library build; React is bundled with the plugin instead of relying on a host global

Components under `src/components/ui` come from the shadcn/ui `base-vega` distribution. Plugin-specific behavior lives in app components rather than edits to those files.

## Development

Requires Node.js >= 24 and pnpm 12.

```bash
pnpm install
pnpm type-check
pnpm test
pnpm build
```

`pnpm build` validates the manifest, runs the type check, builds the production bundle, and creates `package.zip`.

For styling questions (colour, spacing, shape), `pnpm inspect` opens the real panel in headless Chrome and reports what actually rendered. Usage is documented at the top of [scripts/cdp/inspect.mjs](./scripts/cdp/inspect.mjs).

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

Releases use [semantic-release](https://github.com/semantic-release/semantic-release) and are fully automated:

1. a push or merged PR to `main` computes the next version from Conventional Commits
2. `package.json`, `public/plugin.json` and `CHANGELOG.md` are updated automatically
3. the `vX.Y.Z` tag is created, then `pnpm check` and the production build run
4. a GitHub Release is created and `package.zip` is uploaded

No manual version bump or release PR is required. Commit messages must follow Conventional Commits (`feat:` / `fix:` / `chore:`…).

## Changelog

[Changelog](./CHANGELOG.md)

## Reference and Thanks

- [BryceAndJuly](https://github.com/BryceAndJuly) for the [first community implementation](https://ld246.com/article/1662969146166)
- [HowcanoeWang/calendar](https://github.com/HowcanoeWang/calendar) for decompilation and feature work on the previous project
- [Jiuyan](https://github.com/leolee9086) for the WebSocket wrapper template

## License

[License](./LICENSE)
