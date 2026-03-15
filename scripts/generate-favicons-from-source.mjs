#!/usr/bin/env node
/**
 * Generate favicon assets from a source PNG.
 * Usage: node scripts/generate-favicons-from-source.mjs <input.png>
 */

import sharp from 'sharp';
import toIco from 'to-ico';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const inputPath = process.argv[2] || join(publicDir, 'favicon-source.png');

async function main() {
  const input = sharp(inputPath);

  const png16 = await input
    .clone()
    .resize(16, 16)
    .png()
    .toBuffer();
  const png32 = await input
    .clone()
    .resize(32, 32)
    .png()
    .toBuffer();
  const png180 = await input
    .clone()
    .resize(180, 180)
    .png()
    .toBuffer();

  await sharp(png16).toFile(join(publicDir, 'favicon-16x16.png'));
  console.log('✓ favicon-16x16.png');

  await sharp(png32).toFile(join(publicDir, 'favicon-32x32.png'));
  console.log('✓ favicon-32x32.png');

  await sharp(png180).toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png');

  const ico = await toIco([png16, png32]);
  writeFileSync(join(publicDir, 'favicon.ico'), ico);
  console.log('✓ favicon.ico');

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
