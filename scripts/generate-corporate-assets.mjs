#!/usr/bin/env node
/**
 * Generate corporate B&W logo and favicons from logo.jpg.
 * Run: node scripts/generate-corporate-assets.mjs
 *
 * Outputs to public/:
 * - logo-corporate-bw.png (full-size grayscale)
 * - favicon-corporate-16x16.png (round, light bg)
 * - favicon-corporate-32x32.png
 * - favicon-corporate.ico (multi-size)
 * - apple-touch-icon-corporate.png (180x180)
 * - android-chrome-192x192-corporate.png
 * - android-chrome-512x512-corporate.png
 */

import sharp from 'sharp';
import toIco from 'to-ico';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const inputPath = join(publicDir, 'logo.jpg');

/**
 * Create a round favicon: circular mask + light background for visibility.
 */
async function createRoundFavicon(input, size) {
  const pad = Math.round(size * 0.08);
  const logoSize = size - 2 * pad;
  const logoBuf = await input
    .clone()
    .grayscale()
    .normalize()
    .resize(logoSize, logoSize)
    .png()
    .toBuffer();

  const circleSvg = `
    <svg width="${size}" height="${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#f5f5f5"/>
    </svg>
  `;

  const logoWithBg = await sharp(Buffer.from(circleSvg))
    .resize(size, size)
    .composite([{ input: logoBuf, left: pad, top: pad }])
    .png()
    .toBuffer();

  const maskSvg = `
    <svg width="${size}" height="${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
    </svg>
  `;

  return sharp(logoWithBg)
    .composite([{ input: Buffer.from(maskSvg), blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function main() {
  const input = sharp(inputPath);

  // 1. Full-size B&W logo (black on transparent - for light backgrounds)
  await input
    .clone()
    .grayscale()
    .png()
    .toFile(join(publicDir, 'logo-corporate-bw.png'));
  console.log('✓ logo-corporate-bw.png');

  // 1b. Inverted B&W logo (white on transparent - for dark backgrounds)
  await input
    .clone()
    .grayscale()
    .negate()
    .png()
    .toFile(join(publicDir, 'logo-corporate-bw-inverted.png'));
  console.log('✓ logo-corporate-bw-inverted.png');

  // 2. Favicon sizes (round, light bg for visibility)
  const sizes = [16, 32, 48];
  for (const size of sizes) {
    const buf = await createRoundFavicon(input.clone(), size);
    await sharp(buf).toFile(join(publicDir, `favicon-corporate-${size}x${size}.png`));
    console.log(`✓ favicon-corporate-${size}x${size}.png`);
  }

  // 3. favicon-corporate.ico (16 and 32, round)
  const png16 = await createRoundFavicon(input.clone(), 16);
  const png32 = await createRoundFavicon(input.clone(), 32);
  const ico = await toIco([png16, png32]);
  writeFileSync(join(publicDir, 'favicon-corporate.ico'), ico);
  console.log('✓ favicon-corporate.ico');

  // 4. Apple touch icon (180x180, round)
  const appleBuf = await createRoundFavicon(input.clone(), 180);
  await sharp(appleBuf).toFile(join(publicDir, 'apple-touch-icon-corporate.png'));
  console.log('✓ apple-touch-icon-corporate.png');

  // 5. Android Chrome icons (round)
  const android192 = await createRoundFavicon(input.clone(), 192);
  await sharp(android192).toFile(join(publicDir, 'android-chrome-192x192-corporate.png'));
  console.log('✓ android-chrome-192x192-corporate.png');

  const android512 = await createRoundFavicon(input.clone(), 512);
  await sharp(android512).toFile(join(publicDir, 'android-chrome-512x512-corporate.png'));
  console.log('✓ android-chrome-512x512-corporate.png');

  // 6. Copy favicons to Web Clipper extension
  const { copyFileSync } = await import('fs');
  const extIcons = join(root, 'extensions', 'web-clipper', 'icons');
  copyFileSync(join(publicDir, 'favicon-corporate-16x16.png'), join(extIcons, 'icon16.png'));
  copyFileSync(join(publicDir, 'favicon-corporate-48x48.png'), join(extIcons, 'icon48.png'));
  console.log('✓ Web Clipper extension icons updated');

  console.log('\nDone. Corporate B&W assets generated.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
