/**
 * Builds every committed web asset from the pristine sources in _brand/.
 * Always regenerates from _brand (never from an already-shrunk copy), so a
 * second run is a byte-identical no-op rather than a slow quality loss.
 *
 *   _brand/hero-photo-x4.png -> public/images/hero-{960,1600,2400}.webp (LCP image, srcset)
 *   _brand/about-x4/*.png -> public/images/about-<photo>-<width>.webp
 *   _brand/logo-*.png     -> src/assets/*.webp (bundled, hashed) + favicons + og-image
 *
 * Run after replacing a source (e.g. when the client sends the original hero
 * photo): bun run optimize:assets
 */
import { mkdirSync, statSync } from "node:fs";
import sharp from "sharp";

const NAVY = { r: 8, g: 25, b: 61, alpha: 1 };
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

mkdirSync("public/images", { recursive: true });
mkdirSync("public/brand", { recursive: true });
mkdirSync("src/assets", { recursive: true });

async function report(path: string) {
  const meta = await sharp(path).metadata();
  const kb = (statSync(path).size / 1024).toFixed(0);
  process.stdout.write(`${path}  ${meta.width}x${meta.height}  ${kb} KB\n`);
}

// ---- photos -----------------------------------------------------------------
// The client's sunset photo, its baked-in copy painted out (scripts/brand/clean_hero.py)
// and upscaled x4 with Real-ESRGAN. 16:9, so it covers any hero shape.
const heroBuffer = await sharp("_brand/hero-photo-x4.png").toBuffer();
for (const width of [960, 1600, 2400]) {
  const out = `public/images/hero-${width}.webp`;
  await sharp(heroBuffer).resize({ width }).webp({ quality: 80, effort: 6 }).toFile(out);
  await report(out);
}

// About photos: cut from the client's "À propos" mock-up (_brand/about-mockup.jpeg),
// upscaled x4 with Real-ESRGAN into _brand/about-x4/. The headlight leads the
// home page's About section (4:3); the other three illustrate the About page.
const aboutPhotos: Array<[string, number[]]> = [
  ["headlight", [720, 1200]],
  ["fleet", [640, 960]],
  ["road", [640, 960]],
  ["wheel", [640, 960]],
];
for (const [name, widths] of aboutPhotos) {
  for (const width of widths) {
    const out = `public/images/about-${name}-${width}.webp`;
    await sharp(`_brand/about-x4/${name}.png`)
      .resize({ width })
      .webp({ quality: 80, effort: 6 })
      .toFile(out);
    await report(out);
  }
}

// ---- logos (bundled) ---------------------------------------------------------
// ~2x the largest rendered size. The header shows the complete logo, tagline
// included (the client wants it exact): rendered up to 88px tall -> 180px.
const logos: Array<[string, string, number]> = [
  ["_brand/logo-full.png", "src/assets/logo-header.webp", 180],
  ["_brand/logo-full-light.png", "src/assets/logo-header-light.webp", 180],
  ["_brand/logo-full-light.png", "src/assets/logo-full-light.webp", 300],
  ["_brand/logo-mark.png", "src/assets/logo-mark.webp", 160],
  ["_brand/logo-mark-light.png", "src/assets/logo-mark-light.webp", 160],
];
for (const [src, out, height] of logos) {
  await sharp(src)
    .resize({ height })
    .webp({ quality: 90, alphaQuality: 100, effort: 6 })
    .toFile(out);
  await report(out);
}

// ---- icons + social card -----------------------------------------------------
async function squareIcon(size: number, out: string, background = WHITE, pad = 0.14) {
  const inner = Math.round(size * (1 - pad * 2));
  const mark = await sharp("_brand/logo-mark.png")
    .resize({ width: inner, height: inner, fit: "contain", background: { ...WHITE, alpha: 0 } })
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: mark, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(out);
  await report(out);
}
await squareIcon(32, "public/favicon-32.png", WHITE, 0.04);
await squareIcon(16, "public/favicon-16.png", WHITE, 0.02);
await squareIcon(180, "public/apple-touch-icon.png");
await squareIcon(512, "public/brand/logo-512.png");

await sharp("_brand/logo-full.png")
  .resize({ width: 512 })
  .png({ compressionLevel: 9 })
  .toFile("public/brand/logo-full-512.png");
await report("public/brand/logo-full-512.png");

// OG card: a straight crop of the hero photo (platforms print the title and
// description themselves; baking text in would only repeat it).
// 1200x630 out of the right of the photo: the three cars and the sun.
await sharp(heroBuffer)
  .resize({ height: 900 })
  .extract({ left: 401, top: 150, width: 1200, height: 630 })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile("public/og-image.jpg");
await report("public/og-image.jpg");

// Loader / error screens on navy want the light mark as a static file too.
await sharp("_brand/logo-mark-light.png")
  .resize({ height: 96 })
  .flatten({ background: NAVY })
  .png()
  .toFile("public/brand/mark-on-navy.png");
await report("public/brand/mark-on-navy.png");
