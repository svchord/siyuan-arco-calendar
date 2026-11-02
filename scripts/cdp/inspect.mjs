/**
 * Inspect the actual rendered calendar UI.
 *
 * Probes (what to measure):
 *   pnpm inspect                                        # panel, footer, settings trigger
 *   pnpm inspect '[data-slot="calendar-today-button"]'   # computed styles
 *   pnpm inspect '...' --rules                          # matched CSS rules + sources
 *   pnpm inspect '...' --pixels                         # per-pixel shape bands
 *   pnpm inspect '...' --all                            # every match, not just the first
 *   pnpm inspect '...' --json                           # structured output
 *
 * Actions (drive the UI before measuring):
 *   --do today                     select today, so the selected state is rendered
 *   --do view:heatmap              switch to the heatmap view
 *   --do settings                  open the settings popover
 *   --do 'click:<selector>'        click anything
 *   --do 'move:x,y' / wait:ms / close / open
 *   --do can be repeated, and a comma separates actions:
 *     --do today,wait:800
 *
 * Output and environment:
 *   --shot                     full-page screenshot to ./inspect.png
 *   --zoom N                   pixel-probe magnification (default 4; page size unaffected)
 *   --viewport WxH[@DPR]       page viewport, e.g. 1280x764@2
 *   --attach                   reuse the browser from a running dev session
 *
 * Examples:
 *   pnpm inspect 'button[data-today="true"]' --pixels --zoom 8
 *   pnpm inspect --do today --viewport 1280x764@2 --shot
 *   pnpm inspect --do view:heatmap '[data-slot="calendar-heatmap"]' --rules
 */
import { createSession, parseViewport, runActions } from './session.mjs';
import { probeEnvironment, probePixels, probeRules, probeStyles } from './probes.mjs';

const DEFAULT_SELECTORS = [
  '.sy-calendar-popup',
  '[data-slot="calendar-panel"]',
  '[data-slot="calendar-footer"]',
  '[data-slot="calendar-settings-trigger"]',
];

/** Remove every `--flag value` pair from argv, returning values and the remainder. */
function takeOptions(args, flags) {
  const values = {};
  let rest = [...args];
  for (const flag of flags) {
    while (rest.includes(flag)) {
      const index = rest.indexOf(flag);
      const value = rest[index + 1];
      if (value === undefined || value.startsWith('--')) {
        throw new Error(flag + ' 需要一个参数');
      }
      (values[flag] ??= []).push(value);
      rest = rest.filter((_, i) => i !== index && i !== index + 1);
    }
  }
  return { values, rest };
}

function parseArgs(argv) {
  const { values, rest } = takeOptions(argv, ['--css', '--zoom', '--viewport', '--do']);

  const asJson = rest.includes('--json');
  const includeRules = rest.includes('--rules');
  const includeAll = rest.includes('--all');
  const shot = rest.includes('--shot');
  const attach = rest.includes('--attach');
  const pixels = rest.includes('--pixels');

  const actions = (values['--do'] ?? [])
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    selectors: rest.filter((arg) => !arg.startsWith('--')),
    actions,
    css: values['--css'] ?? [],
    zoom: Number(values['--zoom']?.[0] ?? 4),
    viewport: parseViewport(values['--viewport']?.[0]),
    asJson,
    includeRules,
    includeAll,
    shot,
    attach,
    pixels,
  };
}

function formatStyles(result) {
  const lines = [];
  if (!result.count) return [result.selector + ' (no match)'];
  for (const item of result.items) {
    const values = Object.entries(item.props)
      .map(([name, value]) => name + '=' + value)
      .join(' ');
    lines.push(result.selector + ' (' + result.count + 'x) <' + item.tag + '> ' + values);
  }
  return lines;
}

function formatRules(result) {
  if (!result.rules?.length) return [];
  return result.rules.map(
    (rule) => '    [' + rule.source + '] ' + rule.selector + ' { ' + rule.properties.join('; ') + ' }'
  );
}

function formatPixels(result) {
  const lines = [
    'pixels: ' + result.file + ' (' + result.analysis.width + 'x' + result.analysis.height + ' @' + result.zoom + 'x)',
  ];
  if (!result.analysis.bands.length) {
    lines.push('    (no contrasting pixels found)');
    return lines;
  }
  for (const band of result.analysis.bands) {
    lines.push(
      '    band y=' +
        band.top +
        '..' +
        band.bottom +
        ' h=' +
        band.height +
        ' w=' +
        band.width +
        ' aspect=' +
        band.aspect +
        (band.aspect === 1 ? '  <- circle' : '')
    );
    lines.push('      profile: ' + band.profile.join('-'));
  }
  return lines;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const session = await createSession({ viewport: options.viewport, attach: options.attach });

  try {
    if (options.actions.length) await runActions(session, options.actions);
    for (const sheet of options.css) {
      await runActions(session, ['css:' + sheet]);
    }

    const env = await probeEnvironment(session.page, session);
    const targets = options.selectors.length ? options.selectors : DEFAULT_SELECTORS;
    const results = [];

    for (const selector of targets) {
      const result = await probeStyles(session.page, selector, options.includeAll ? 5 : 1);
      if (options.includeRules && result.count) {
        result.rules = await probeRules(env.client, env.document.root.nodeId, selector, env.sheets);
      }
      if (options.pixels && result.count) {
        result.pixels = await probePixels(session.page, selector, {
          zoom: options.zoom,
          viewport: options.viewport,
        });
      }
      results.push(result);
    }

    const report = {
      opened: env.opened,
      theme: env.theme,
      mode: env.mode,
      actions: options.actions,
      viewport: options.viewport,
      zoom: options.zoom,
      injected: options.css,
      selectors: results,
    };

    if (options.asJson) {
      console.log(JSON.stringify(report));
    } else {
      console.log('[inspect] theme=' + env.theme + ' mode=' + env.mode + ' opened=' + env.opened);
      if (options.actions.length) console.log('[inspect] actions=' + options.actions.join(' -> '));
      for (const result of results) {
        for (const line of formatStyles(result)) console.log('[inspect] ' + line);
        if (options.includeRules) {
          for (const line of formatRules(result)) console.log(line);
        }
        if (result.pixels) {
          for (const line of formatPixels(result.pixels)) console.log('[inspect] ' + line);
        }
      }
    }

    if (options.shot) {
      await session.page.screenshot({ path: './inspect.png' });
      console.log('[inspect] screenshot: ./inspect.png');
    }
  } finally {
    await session.dispose();
  }
}

try {
  await main();
} catch (error) {
  console.error('[inspect] ' + (error instanceof Error ? error.message : String(error)));
  process.exit(1);
}
