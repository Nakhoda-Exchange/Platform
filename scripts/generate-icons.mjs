// Generate the PWA/app icons + favicon from the Nakhoda logo mark
// (public/logo.svg) centered on a brand-blue square.
// Run: bun run scripts/generate-icons.mjs   (regenerate after a logo change)
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const BRAND = "#0023fb";
const SRC = "public/logo.svg";

mkdirSync("public/icons", { recursive: true });

// [out, canvas size, emblem fraction of canvas]. Maskable uses a smaller
// fraction so the emblem survives the platform safe-zone crop.
const jobs = [
  ["public/icons/icon-192.png", 192, 0.82],
  ["public/icons/icon-512.png", 512, 0.82],
  ["public/icons/icon-maskable-512.png", 512, 0.6],
  ["app/apple-icon.png", 180, 0.82],
  ["app/icon.png", 256, 0.82],
];

for (const [out, size, fraction] of jobs) {
  const inner = Math.round(size * fraction);
  const emblem = await sharp(SRC)
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: BRAND },
  })
    .composite([{ input: emblem, gravity: "center" }])
    .png()
    .toFile(out);
  console.log("wrote", out);
}
