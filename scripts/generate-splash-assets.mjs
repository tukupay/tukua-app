/**
 * Builds splash assets from the master icon:
 * - splash-logo.png: logo on transparent background (for native + in-app splash)
 * - splash.png: full portrait frame for reference / legacy tooling
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const source = path.join(root, 'assets/images/icons/tukua-icon.png');
const outDir = path.join(root, 'assets/images');
const splashLogo = path.join(outDir, 'splash-logo.png');
const splashFull = path.join(outDir, 'splash.png');

const SPLASH_BG = { r: 21, g: 65, b: 29, alpha: 1 }; // #15411D
const FRAME_W = 1284;
const FRAME_H = 2778;
const LOGO_WIDTH = 920;

async function logoWithTransparentBackground() {
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > 235 && g > 235 && b > 235) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).png();
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const logo = await logoWithTransparentBackground();
  await logo.clone().toFile(splashLogo);

  const meta = await logo.metadata();
  const logoHeight = Math.round((LOGO_WIDTH * meta.height) / meta.width);
  const logoBuffer = await logo.resize(LOGO_WIDTH, logoHeight).png().toBuffer();

  await sharp({
    create: {
      width: FRAME_W,
      height: FRAME_H,
      channels: 4,
      background: SPLASH_BG,
    },
  })
    .composite([{ input: logoBuffer, gravity: 'center' }])
    .png()
    .toFile(splashFull);

  console.log('Created', splashLogo);
  console.log('Created', splashFull);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
