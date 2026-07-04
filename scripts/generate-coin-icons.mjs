// Fetch real coin logos from CoinGecko and write them to public/coins/<symbol>.png
// (self-contained, so no remote-image config / CSP concerns).
// Run: node scripts/generate-coin-icons.mjs
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const SYMBOLS = [
  "btc",
  "eth",
  "sol",
  "doge",
  "ton",
  "pepe",
  "usdt",
  "bnb",
  "xrp",
  "ada",
  "wif",
  "bome",
  "mew",
];

const res = await fetch(
  `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&symbols=${SYMBOLS.join(",")}&per_page=60`,
);
const list = await res.json();
if (!Array.isArray(list))
  throw new Error("CoinGecko error: " + JSON.stringify(list).slice(0, 200));

mkdirSync("public/coins", { recursive: true });
const wanted = new Set(SYMBOLS.map((s) => s.toUpperCase()));
let n = 0;
for (const c of list) {
  const sym = c.symbol.toUpperCase();
  if (!wanted.has(sym)) continue;
  const bytes = await (await fetch(c.image)).arrayBuffer();
  const png = await sharp(Buffer.from(bytes))
    .resize(128, 128, { fit: "cover" })
    .png()
    .toBuffer();
  writeFileSync(`public/coins/${sym.toLowerCase()}.png`, png);
  n++;
}
console.log(`wrote ${n} coin icons to public/coins/`);
