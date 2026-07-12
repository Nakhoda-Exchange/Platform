// Generate the PWA/app icons + favicon from the Nakhoda logo mark
// (public/logo.svg) centered on a solid square.
// Run: bun run scripts/generate-icons.mjs   (regenerate after a logo change)
import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";

const ICON_BG = "#000000"; // black — matches the mark's design and the dark theme
const SRC = "public/logo.svg";

// The source SVG adapts via @media, which sharp can't resolve — pin the mark to
// its on-dark colours (white shield, brand anchor) and a transparent bg so it
// composites cleanly onto the square.
const iconMark = readFileSync(SRC, "utf8").replace(
  /<style[\s\S]*?<\/style>/,
  "<style>#shield{fill:#ffffff}#anchor{fill:#2477ec}</style>",
);

mkdirSync("public/icons", { recursive: true });

// [out, canvas size, mark fraction of canvas]. Maskable uses a smaller fraction
// so the mark survives the platform safe-zone crop.
const jobs = [
  ["public/icons/icon-192.png", 192, 0.82],
  ["public/icons/icon-512.png", 512, 0.82],
  ["public/icons/icon-maskable-512.png", 512, 0.6],
  ["app/apple-icon.png", 180, 0.82],
  ["app/icon.png", 256, 0.82],
];

for (const [out, size, fraction] of jobs) {
  const inner = Math.round(size * fraction);
  const mark = await sharp(Buffer.from(iconMark))
    .resize(inner, inner, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: ICON_BG },
  })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toFile(out);
  console.log("wrote", out);
}
