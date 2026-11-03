/**
 * Probes read facts from a page and return plain data. They never print and never
 * mutate the page, so any action sequence can be paired with any probe.
 */

const STYLE_PROPS = [
  'display',
  'width',
  'height',
  'color',
  'background-color',
  'background-image',
  'background-size',
  'background-position',
  'background-repeat',
  'font-size',
  'font-weight',
  'line-height',
  'padding-top',
  'padding-left',
  'margin-top',
  'border-radius',
  'corner-shape',
  'box-shadow',
  'gap',
  'overflow',
  'position',
  'z-index',
  'transform',
  'scale',
  'opacity',
  'transition-property',
  'transition-duration',
  'transition-timing-function',
];

const EMPTY_VALUES = new Set(['auto', 'none', 'normal', '0px', 'rgba(0, 0, 0, 0)']);
/** Properties where `none` is meaningful and must not be filtered out. */
const KEEP_NONE = new Set(['display', 'visibility', 'opacity']);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Computed styles for up to `limit` matches of `selector`. */
export async function probeStyles(page, selector, limit = 1) {
  const data = await page.evaluate(
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
            className: String(element.className || ''),
            props: values,
          };
        }),
      };
    },
    selector,
    STYLE_PROPS,
    limit
  );

  return {
    selector,
    count: data.count,
    items: data.items.map((item) => ({
      ...item,
      props: Object.fromEntries(
        Object.entries(item.props).filter(([name, value]) => value && (KEEP_NONE.has(name) || !EMPTY_VALUES.has(value)))
      ),
    })),
  };
}

/** Matched CSS rules for the first match of `selector`, via the CSS domain. */
export async function probeRules(client, documentNodeId, selector, sheets) {
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
      properties: (match.rule.cssProperties || [])
        .filter((property) => property.value !== '')
        .slice(0, 6)
        .map((property) => property.name + ': ' + property.value),
    });
  }
  return rules.slice(0, 8);
}

/**
 * Per-pixel shape analysis of one element.
 *
 * Splits the painted ink into horizontal bands and reports each band's width/height
 * ratio, so shape problems (a dot rasterised squashed, a glyph clipped by sub-pixel
 * rounding) become measurable. A day cell paints two bands — the digit and the today
 * dot — and both are reported.
 *
 * `zoom` only magnifies this crop; it does not resize the page.
 */
export async function probePixels(page, selector, { zoom = 4, viewport, output = './inspect-pixels.png' } = {}) {
  const geometry = await page.evaluate((target) => {
    const el = document.querySelector(target);
    if (!el) return null;
    const box = el.getBoundingClientRect();
    return { rect: { x: box.x, y: box.y, width: box.width, height: box.height }, dpr: devicePixelRatio };
  }, selector);
  if (!geometry) return null;

  const { rect } = geometry;
  const pad = 2;
  const clip = {
    x: Math.max(0, rect.x - pad),
    y: Math.max(0, rect.y - pad),
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };

  const previousDpr = geometry.dpr;
  const session = await page.createCDPSession();
  const emulate = (scale) =>
    session.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: scale,
      mobile: false,
    });

  if (zoom !== previousDpr) {
    await emulate(zoom);
    await sleep(150);
  }

  const buffer = await page.screenshot({ clip, encoding: 'base64' });

  if (zoom !== previousDpr) {
    await emulate(previousDpr);
    await sleep(150);
  }
  await session.detach();

  const analysis = await page.evaluate(async (data) => {
    const image = new Image();
    image.src = 'data:image/png;base64,' + data;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    const { data: px } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const at = (x, y) => {
      const i = (y * canvas.width + x) * 4;
      return [px[i], px[i + 1], px[i + 2]];
    };
    const bg = at(0, 0);
    // Small marks sit close to the backdrop in luminance, so the threshold has to
    // be low enough to catch antialiased edges.
    const differs = (c) => Math.abs(c[0] - bg[0]) + Math.abs(c[1] - bg[1]) + Math.abs(c[2] - bg[2]) > 8;

    const rows = [];
    for (let y = 0; y < canvas.height; y++) {
      let min = -1;
      let max = -1;
      let count = 0;
      for (let x = 0; x < canvas.width; x++) {
        if (differs(at(x, y))) {
          if (min === -1) min = x;
          max = x;
          count++;
        }
      }
      if (count) rows.push({ y, min, max, count });
    }

    if (!rows.length) {
      return { width: canvas.width, height: canvas.height, bg, bands: [] };
    }

    const groups = [];
    let current = [rows[0]];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].y - rows[i - 1].y <= 1) current.push(rows[i]);
      else {
        groups.push(current);
        current = [rows[i]];
      }
    }
    groups.push(current);

    const bands = groups.map((band) => {
      const top = band[0].y;
      const bottom = band[band.length - 1].y;
      const height = bottom - top + 1;
      const width = Math.max(...band.map((r) => r.max - r.min + 1));
      return {
        top,
        bottom,
        height,
        width,
        aspect: Number((width / height).toFixed(2)),
        profile: band.map((r) => r.max - r.min + 1),
      };
    });

    return { width: canvas.width, height: canvas.height, bg, bands };
  }, buffer);

  return { file: output, selector, zoom, geometry, analysis };
}

/** Host theme metadata for the report header. */
export async function probeEnvironment(page, session) {
  const head = await page.evaluate(() => {
    const config = window.siyuan?.config?.appearance;
    const themeLink = document.getElementById('themeStyle');
    return {
      theme: config?.themeLight,
      mode: config?.mode,
      href: themeLink?.getAttribute('href') || null,
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

  return { ...head, opened: session.opened, client, document, sheets };
}
