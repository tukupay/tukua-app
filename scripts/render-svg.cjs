#!/usr/bin/env node
/**
 * Render an SVG to PNG at a given size with transparent background, using Playwright's Chromium
 * (installed for the desktop tests; this app has no image library of its own).
 *
 *   node scripts/render-svg.cjs <in.svg> <out.png> [size=1024]
 */
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

const req = createRequire(path.resolve(__dirname, '../../desktop/package.json'));
const { chromium } = req('playwright');

(async () => {
  const [input, output, sizeArg] = process.argv.slice(2);
  const size = Number(sizeArg || 1024);
  const svg = fs.readFileSync(input, 'utf8').replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await page.locator('svg').screenshot({ path: output, omitBackground: true });
  await browser.close();
  console.log(`${output} (${size}x${size})`);
})();
