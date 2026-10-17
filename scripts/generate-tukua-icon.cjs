#!/usr/bin/env node
/**
 * Build every Tukua icon from the one master, assets/images/icons/tukua-mark.svg (same idea as the
 * e-Post icon pipeline): the rounded tile for the splash and web, a full-bleed square for the store
 * icon (iOS and Android round their own corners), the Android adaptive foreground inside the safe
 * zone, a white silhouette for notifications, and a favicon.
 *
 * Renders with Playwright's Chromium from desktop/node_modules (this app has no image library).
 *
 *   node scripts/generate-tukua-icon.cjs
 */
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

const req = createRequire(path.resolve(__dirname, '../../desktop/package.json'));
const { chromium } = req('playwright');

const ROOT = path.resolve(__dirname, '..');
const ICONS = path.join(ROOT, 'assets/images/icons');
const LOGO = path.join(ROOT, 'assets/images/logo');
const master = fs.readFileSync(path.join(ICONS, 'tukua-mark.svg'), 'utf8');

/** Tile colour behind the Android adaptive foreground (the bottom of the tile gradient). */
const ADAPTIVE_BACKGROUND = '#172C1F';

const defs = master.match(/<defs>[\s\S]*?<\/defs>/)[0];
const tileRect = master.match(/<rect [^>]*\/>/)[0];
// Everything drawn on the tile: the graduation cap over the open book.
const art = master.slice(master.indexOf(tileRect) + tileRect.length, master.lastIndexOf('</svg>'));

const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">${defs}${body}</svg>`;

const variants = {
  /** Rounded tile with its rim, on transparent: splash, loading screen, web. */
  tile: svg(tileRect + art),
  /** Full-bleed square: the store icon; the system masks the corners. */
  square: svg(`<rect width="1024" height="1024" fill="url(#tile)"/><g transform="translate(512 512) scale(1.06) translate(-512 -512)">${art}</g>`),
  /** Android adaptive foreground: art inside the 66% safe circle, transparent around it. */
  adaptive: svg(`<g transform="translate(512 512) scale(0.7) translate(-512 -512)">${art}</g>`),
  /** Notification: Android draws only the alpha channel, so a white silhouette (page lines dropped). */
  notification: svg(
    `<g transform="translate(512 512) scale(1.25) translate(-512 -526)">${art
      .replace(/fill="#[0-9A-Fa-f]{6}"/g, 'fill="#FFFFFF"')
      .replace(/stroke="#C9D3C6"/, 'stroke="none"')
      .replace(/stroke="#[0-9A-Fa-f]{6}"/g, 'stroke="#FFFFFF"')}</g>`,
  ),
};

const outputs = [
  ['square', path.join(ICONS, 'tukua-app-icon-1024.png'), 1024],
  ['square', path.join(ICONS, 'tukua-app-icon-512.png'), 512],
  ['square', path.join(ICONS, 'tukua-app-icon-192.png'), 192],
  ['adaptive', path.join(ICONS, 'tukua-adaptive-foreground-1024.png'), 1024],
  ['notification', path.join(ICONS, 'tukua-notification-96.png'), 96],
  ['tile', path.join(ICONS, 'tukua-favicon-48.png'), 48],
  ['tile', path.join(LOGO, 'splash-tukua.png'), 600],
  ['tile', path.join(LOGO, 'splash-tukua-hd.png'), 1200],
];

(async () => {
  const browser = await chromium.launch();
  for (const [variant, out, size] of outputs) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    const markup = variants[variant].replace('width="1024" height="1024"', `width="${size}" height="${size}"`);
    await page.setContent(`<html><body style="margin:0;background:transparent">${markup}</body></html>`);
    await page.locator('svg').screenshot({ path: out, omitBackground: true });
    await page.close();
    console.log(`${path.relative(ROOT, out)} (${size}x${size})`);
  }
  await browser.close();
  console.log(`adaptive background colour: ${ADAPTIVE_BACKGROUND}`);
})();
