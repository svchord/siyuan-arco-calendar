/**
 * Browser session for the CDP inspection scripts.
 *
 * Owns the lifecycle (launch or attach, open SiYuan, open the calendar panel) and
 * exposes `runActions` so callers can drive the UI into any state before probing:
 *
 *   const session = await createSession({ viewport });
 *   await runActions(session, ['today', 'wait:300', 'move:5,700']);
 *   ...probe...
 *   await session.dispose();
 */
import { existsSync, readFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import { findChrome, findKernelPort, frontendUrl } from './siyuan.mjs';

const PANEL_SELECTOR = '[data-slot="calendar-panel"], .sy-calendar-dock';
const TOPBAR_SELECTOR = '[data-id="arco-calendar-topbar"]';
const DOCK_SELECTOR = '.dock__item[data-type*="arco-calendar"]';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Parse `WIDTHxHEIGHT[@DPR]`, falling back to a sensible desktop viewport. */
export function parseViewport(value, fallback = { width: 1600, height: 1000, deviceScaleFactor: 1 }) {
  if (!value) return fallback;
  const match = value.match(/^(\d+)x(\d+)(?:@([\d.]+))?$/);
  if (!match) throw new Error('viewport 格式应为 宽x高[@DPR]，例如 1280x764@2');
  return {
    width: Number(match[1]),
    height: Number(match[2]),
    deviceScaleFactor: Number(match[3] ?? 1),
  };
}

async function openPanel(page) {
  if (await page.$(PANEL_SELECTOR)) {
    return 'already-open';
  }

  const topbar = await page.$(TOPBAR_SELECTOR);
  if (topbar) {
    await topbar.click();
    await page.waitForSelector(PANEL_SELECTOR, { timeout: 5000 });
    return 'topbar';
  }

  const dock = await page.$(DOCK_SELECTOR);
  if (dock) {
    await dock.click();
    await page.waitForSelector('.sy-calendar-dock', { timeout: 5000 });
    return 'dock';
  }

  throw new Error('页面里找不到 arco-calendar 入口；请先在思源中启用插件或打开日历');
}

/**
 * Open a session. With `attach` and an existing `.rc-cdp-ws` it reuses the browser
 * exposed by a running dev session; otherwise it launches headless Chrome.
 */
export async function createSession({ viewport, attach = false } = {}) {
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
      defaultViewport: viewport,
      args: ['--no-first-run', '--no-default-browser-check'],
    });
    const fresh = await browser.newPage();
    await fresh.goto(frontendUrl(port), { waitUntil: 'domcontentloaded', timeout: 30000 });
    await fresh.waitForFunction('window.siyuan && window.siyuan.config', { timeout: 30000 });
    await sleep(1500);
    await fresh.waitForFunction(`document.querySelector('${TOPBAR_SELECTOR}, ${DOCK_SELECTOR}')`, { timeout: 30000 });
    opened = await openPanel(fresh);
    await sleep(700);
  }

  const pages = await browser.pages();
  const page = pages.find((candidate) => candidate.url().includes('stage/build'));
  if (!page) throw new Error('浏览器里没有思源页面');

  opened = opened || (await openPanel(page));
  await sleep(700);

  return {
    browser,
    page,
    opened,
    attached,
    async dispose() {
      if (attached) await browser.disconnect();
      else await browser.close();
    },
  };
}

/**
 * Drive the panel into a state. Each action is a short string so scenarios stay
 * readable on the command line:
 *
 *   open | close | today | settings | view:heatmap | view:calendar
 *   click:<selector> | move:<x>,<y> | wait:<ms> | css:<stylesheet text>
 */
export async function runActions(session, actions = []) {
  const { page } = session;
  const log = [];

  for (const action of actions) {
    const [verb, ...rest] = action.split(':');
    const argument = rest.join(':');

    switch (verb) {
      case 'open':
        log.push('open -> ' + (await openPanel(page)));
        break;

      case 'close':
        await page.keyboard.press('Escape');
        await sleep(500);
        log.push('close');
        break;

      case 'today':
        await page.click('[data-slot="calendar-today-button"]');
        await sleep(1200);
        log.push('today');
        break;

      case 'settings':
        await page.click('[data-slot="calendar-settings-trigger"]');
        await sleep(700);
        log.push('settings');
        break;

      case 'view': {
        const index = argument === 'heatmap' ? 1 : 0;
        const tabs = await page.$$('[data-slot="tabs-trigger"]');
        if (!tabs[index]) throw new Error('找不到视图切换标签：' + argument);
        await tabs[index].click();
        await sleep(900);
        log.push('view -> ' + argument);
        break;
      }

      case 'click':
        await page.click(argument);
        await sleep(600);
        log.push('click -> ' + argument);
        break;

      case 'hover': {
        // Hover a matched element by moving the pointer to its centre; this drives
        // real :hover rules, which CSS injection cannot reproduce.
        const point = await page.evaluate((selector) => {
          const el = document.querySelector(selector);
          if (!el) return null;
          const box = el.getBoundingClientRect();
          return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        }, argument);
        if (!point) throw new Error('找不到要悬停的元素：' + argument);
        await page.mouse.move(point.x, point.y);
        await sleep(400);
        log.push('hover -> ' + argument);
        break;
      }

      case 'move': {
        const [x, y] = argument.split(',').map(Number);
        await page.mouse.move(x, y);
        await sleep(300);
        log.push('move -> ' + argument);
        break;
      }

      case 'wait':
        await sleep(Number(argument) || 0);
        log.push('wait -> ' + argument + 'ms');
        break;

      case 'css':
        await page.evaluate((sheet) => {
          document.getElementById('inspect-inject')?.remove();
          const style = document.createElement('style');
          style.id = 'inspect-inject';
          style.textContent = sheet;
          document.head.append(style);
        }, argument);
        await sleep(300);
        log.push('css -> injected');
        break;

      default:
        throw new Error('未知动作：' + verb + '（可用：open/close/today/settings/view/click/hover/move/wait/css）');
    }
  }

  return log;
}
