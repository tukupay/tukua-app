#!/usr/bin/env node
/**
 * Screenshot the in-app loading page (SplashLoadingScreen) and the screen after it, on the Expo web
 * build at a phone size. The loading page shows until fonts load, so font requests are held back
 * first, then released.
 *
 *   node scripts/splash-screenshot.cjs [outDir] [url=http://localhost:8081]
 */
const path = require('path');
const { createRequire } = require('module');

const req = createRequire(path.resolve(__dirname, '../../desktop/package.json'));
const { chromium } = req('playwright');

(async () => {
  const outDir = process.argv[2] || '.';
  const url = process.argv[3] || 'http://localhost:8081';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  let release;
  const held = new Promise((r) => (release = r));
  await page.route(/\.(ttf|otf|woff2?)(\?|$)/, async (route) => {
    await held;
    await route.continue();
  });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 180000 });
  const logo = page.locator('img[alt="Tukua"], [aria-label="Tukua"]').first();
  await logo.waitFor({ state: 'visible', timeout: 180000 });
  await page.waitForTimeout(800);
  // page.screenshot waits for fonts, which are held back here; CDP captures as is.
  const cdp = await page.context().newCDPSession(page);
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  require('fs').writeFileSync(path.join(outDir, 'splash-loading.png'), Buffer.from(shot.data, 'base64'));
  const box = await logo.boundingBox();
  console.log('loading page logo box:', box);
  release();
  await page.waitForTimeout(6000);
  await page.screenshot({ path: path.join(outDir, 'after-loading.png') });
  console.log('saved', path.join(outDir, 'splash-loading.png'), path.join(outDir, 'after-loading.png'));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
