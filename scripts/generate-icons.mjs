// Generate the PWA/app icons from the Nakhoda anchor mark (white on brand blue).
// Run: node scripts/generate-icons.mjs   (regenerate after a logo change)
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const BRAND = "#0023fb";
// Anchor path in a 20x20 viewBox (same as components/ui/icons AnchorIcon).
const ANCHOR =
  '<path d="M10 4.9996V18.334M10 4.9996C10.9205 4.9996 11.6667 4.25335 11.6667 3.3328C11.6667 2.41225 10.9205 1.666 10 1.666C9.07953 1.666 8.33333 2.41225 8.33333 3.3328C8.33333 4.25335 9.07953 4.9996 10 4.9996ZM15.8333 10.8334L17.5 10C17.5 11.9893 16.7098 13.8971 15.3033 15.3037C13.8968 16.7104 11.9891 17.5006 10 17.5006C8.01088 17.5006 6.10322 16.7104 4.6967 15.3037C3.29018 13.8971 2.5 11.9893 2.5 10L4.16667 10.8334M7.5 9.1666H12.5"/>';

/** Brand square with the white anchor scaled to `fraction` of the canvas. */
function iconSvg(size, fraction) {
  const scale = (size * fraction) / 20;
  const offset = (size - 20 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${BRAND}"/>
    <g transform="translate(${offset},${offset}) scale(${scale})" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ANCHOR}</g>
  </svg>`;
}

mkdirSync("public/icons", { recursive: true });

const jobs = [
  ["public/icons/icon-192.png", 192, 0.55],
  ["public/icons/icon-512.png", 512, 0.55],
  // maskable: smaller mark so it survives the platform safe-zone crop.
  ["public/icons/icon-maskable-512.png", 512, 0.42],
  ["app/apple-icon.png", 180, 0.55],
];

for (const [out, size, fraction] of jobs) {
  await sharp(Buffer.from(iconSvg(size, fraction)))
    .png()
    .toFile(out);
  console.log("wrote", out);
}
