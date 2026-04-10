#!/usr/bin/env node
/**
 * Generate Echelon raster icons from the SVG mark.
 * Uses sharp (already in devDeps) for SVG→PNG conversion.
 * Uses macOS iconutil for .icns generation.
 */

import sharp from 'sharp';
import { mkdirSync, existsSync, rmSync } from 'fs';
import { execFileSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SVG = join(ROOT, 'public/brand/echelon-icon.svg');
const PUBLIC = join(ROOT, 'public');
const ICONSET = join(ROOT, 'tmp-icon.iconset');

const sizes = [16, 32, 64, 128, 192, 256, 512, 1024];

async function main() {
  console.log('Generating Echelon raster icons from SVG...');

  // Generate PNGs at various sizes
  for (const size of sizes) {
    const out = join(PUBLIC, `brand/echelon-${size}.png`);
    await sharp(SVG).resize(size, size).png().toFile(out);
    console.log(`  > ${size}x${size} -> brand/echelon-${size}.png`);
  }

  // PWA icons
  await sharp(SVG).resize(192, 192).png().toFile(join(PUBLIC, 'icon-192.png'));
  await sharp(SVG).resize(512, 512).png().toFile(join(PUBLIC, 'icon-512.png'));
  await sharp(SVG).resize(180, 180).png().toFile(join(PUBLIC, 'apple-touch-icon.png'));
  console.log('  > PWA icons (192, 512, apple-touch-icon)');

  // Generate macOS .icns via iconutil
  if (existsSync(ICONSET)) rmSync(ICONSET, { recursive: true });
  mkdirSync(ICONSET);

  const icnsSizes = [
    [16, 'icon_16x16.png'],
    [32, 'icon_16x16@2x.png'],
    [32, 'icon_32x32.png'],
    [64, 'icon_32x32@2x.png'],
    [128, 'icon_128x128.png'],
    [256, 'icon_128x128@2x.png'],
    [256, 'icon_256x256.png'],
    [512, 'icon_256x256@2x.png'],
    [512, 'icon_512x512.png'],
    [1024, 'icon_512x512@2x.png'],
  ];

  for (const [size, name] of icnsSizes) {
    await sharp(SVG).resize(size, size).png().toFile(join(ICONSET, name));
  }

  execFileSync('iconutil', ['-c', 'icns', ICONSET, '-o', join(PUBLIC, 'icon.icns')]);
  rmSync(ICONSET, { recursive: true });
  console.log('  > icon.icns (macOS app icon)');

  // Favicon (32x32 PNG)
  await sharp(SVG).resize(32, 32).png().toFile(join(PUBLIC, 'favicon.ico'));
  console.log('  > favicon.ico');

  console.log('Done!');
}

main().catch(err => { console.error(err); process.exit(1); });
