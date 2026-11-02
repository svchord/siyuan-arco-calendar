/**
 * Inspect the actual rendered calendar UI without taking a screenshot.
 *
 *   pnpm inspect
 *   pnpm inspect '[data-slot="calendar-day"]'
 *   pnpm inspect --json
 *   pnpm inspect --rules
 *   pnpm inspect --shot
 *
 * It opens SiYuan's frontend in headless Chrome (or connects to the browser
 * exposed by a running dev session), opens the calendar panel, then prints
 * computed styles. Matched CSS rules are opt-in with --rules; screenshots are
 * opt-in with --shot.
 */
import { existsSync, readFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { findChrome, findKernelPort, frontendUrl } from './siyuan.mjs';

const rawArgs = process.argv.slice(2);
const selectors = rawArgs.filter((arg) => !arg.startsWith('--'));
const asJson = rawArgs.includes('--json');
const includeRules = rawArgs.includes('--rules');
const includeAll = rawArgs.includes('--all');
const shot = rawArgs.includes('--shot');
const attach = rawArgs.includes('--attach');

const DEFAULT_SELECTORS = [
  '.sy-calendar-popup',
  '[data-slot="calendar-panel"]',
  '[data-slot="calendar-footer"]',
  '[data-slot="calendar-settings-trigger"]',
];

const PROPS = [
  'display',
  'width',
  'height',
  'color',
  'background-color',
  'background-image',
  'font-size',
  'font-weight',
  'line-height',
  'padding-top',
  'padding-left',
  'margin-top',
  'border-radius',
  'box-shadow',
  'gap',
  'overflow',
  'position',
  'z-index',
];

const EMPTY_VALUES = new Set(['auto', 'none', 'normal', '0px', 'rgba(0, 0, 0, 0)']);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function openCalendar(page) {
  if (await page.$('[data-slot="calendar-panel"], .sy-calendar-dock')) {
    return 'already-open';
  }

  const topbar = await page.$('[data-id="arco-calendar-topbar"]');
  if (topbar) {
    await topbar.click();
    await page.waitForSelector('[data-slot="calendar-panel"], .sy-calendar-dock', { timeout: 5000 });
    return 'topbar';
  }

  const dock = await page.$('.dock__item[data-type*="arco-calendar"]');
  if (dock) {
    await dock.click();
    await page.waitForSelector('.sy-calendar-dock', { timeout: 5000 });
    return 'dock';
  }

  throw new Error('页面里找不到 arco-calendar 入口；请先在思源中启用插件或打开日历');
}

async function readPage(page, selector, limit) {
  return page.evaluate(
    (target, props, maxItems) => {
      const elements = Array.from(document.querySelectorAll(target));
      return {
        count: elements.length,
        items: elements.slice(0, maxItems).map((element) => {
          const style = getComputedStyle(element);
          const values = {};
          for (const prop of props) {
            values[prop] = style.getPropertyValue(prop);
          }
          return {
            tag: element.tagName.toLowerCase(),
            className: String(element.className || '').slice(0, 60),
            props: values,
          };
        }),
      };
    },
    selector,
    PROPS,
    limit
  );
}

async function readMatchedRules(client, documentNodeId, selector, sheets) {
  const query = await client.send('DOM.querySelector', { nodeId: documentNodeId, selector });
  if (!query.nodeId) return [];

  const matched = await client.send('CSS.getMatchedStylesForNode', { nodeId: query.nodeId });
  const rules = [];
  for (const match of matched.matchedCSSRules || []) {
    const url = sheets.get(match.rule.styleSheetId) || '';
    if (match.rule.origin === 'user-agent') continue;

    let source = '(inline <style>)';
    if (url) {
      const themeIndex = url.indexOf('/appearance/themes/');
      source = themeIndex >= 0 ? url.slice(themeIndex + '/appearance/themes/'.length) : url.slice(-64);
    }

    rules.push({
      source,
      selector: match.rule.selectorList.text,
      properties: (match.rule.style.cssProperties || [])
        .filter((property) => property.value !== '')
        .slice(0, 6)
        .map((property) => property.name + ': ' + property.value),
    });
  }
  return rules.slice(0, 8);
}

async function main() {
  let browser;
  let attached = false;
  let opened = '';
  if (attach && existsSync('.rc-cdp-ws')) {
    browser = await puppeteer.connect({
      browserWSEndpoint: readFileSync('.rc-cdp-ws', 'utf8').trim(),
      defaultViewport: null,
    });
    attached = true;
  } else {
    const port = await findKernelPort();
    browser = await puppeteer.launch({
      executablePath: findChrome(),
      headless: true,
      defaultViewport: { width: 1600, height: 1000 },
      args: ['--no-first-run', '--no-default-browser-check'],
    });
    const page = await browser.newPage();
    await page.goto(frontendUrl(port), { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction('window.siyuan && window.siyuan.config', { timeout: 30000 });
    await sleep(1500);
    await page.waitForFunction(
      'document.querySelector(\'[data-id="arco-calendar-topbar"], .dock__item[data-type*="arco-calendar"]\')',
      { timeout: 30000 }
    );
    opened = await openCalendar(page);
    await sleep(700);
  }

  const pages = await browser.pages();
  const page = pages.find((candidate) => candidate.url().includes('stage/build'));
  if (!page) throw new Error('浏览器里没有思源页面');
  opened = opened || (await openCalendar(page));
  await sleep(700);

  const head = await page.evaluate(() => {
    const config = window.siyuan?.config?.appearance;
    const themeLink = document.getElementById('themeStyle');
    return {
      theme: config?.themeLight,
      themeMode: config?.mode,
      href: themeLink?.getAttribute('href'),
      url: location.href,
    };
  });

  const client = await page.createCDPSession();
  await client.send('DOM.enable');
  await client.send('CSS.enable');
  const sheets = new Map();
  client.on('CSS.styleSheetAdded', (event) => {
    if (event.header) sheets.set(event.header.styleSheetId, event.header.sourceURL || '');
  });
  await sleep(300);
  const document = await client.send('DOM.getDocument', { depth: 1 });

  const targets = selectors.length ? selectors : DEFAULT_SELECTORS;
  const results = [];
  for (const selector of targets) {
    const data = await readPage(page, selector, includeAll ? 5 : 1);
    const rules =
      includeRules && data.count ? await readMatchedRules(client, document.root.nodeId, selector, sheets) : [];
    const items = data.items.map((item) => ({
      ...item,
      props: Object.fromEntries(Object.entries(item.props).filter(([, value]) => value && !EMPTY_VALUES.has(value))),
    }));
    results.push(includeRules ? { selector, ...data, items, rules } : { selector, ...data, items });
  }

  const report = {
    opened,
    theme: head.theme,
    mode: head.themeMode,
    selectors: results,
  };

  if (asJson) {
    console.log(JSON.stringify(report));
  } else {
    console.log('[inspect] theme=' + head.theme + ' mode=' + head.themeMode + ' opened=' + opened);
    for (const result of results) {
      if (!result.count) {
        console.log('[inspect] ' + result.selector + ' (no match)');
        continue;
      }
      for (const item of result.items) {
        const values = Object.entries(item.props)
          .filter(([, value]) => value && !EMPTY_VALUES.has(value))
          .map(([name, value]) => name + '=' + value)
          .join(' ');
        console.log('[inspect] ' + result.selector + ' (' + result.count + 'x) <' + item.tag + '> ' + values);
        if (includeRules && result.rules?.length) {
          for (const rule of result.rules) {
            console.log('    [' + rule.source + '] ' + rule.selector + ' { ' + rule.properties.join('; ') + ' }');
          }
        }
      }
    }
  }

  if (shot) {
    await page.screenshot({ path: './inspect.png' });
    console.log('[inspect] screenshot: ./inspect.png');
  }

  if (attached) {
    await browser.disconnect();
  } else {
    await browser.close();
  }
}

try {
  await main();
} catch (error) {
  console.error('[inspect] ' + (error instanceof Error ? error.message : String(error)));
  process.exit(1);
}
