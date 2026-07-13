/** Sample coins for the marketing landing — decorative (the app is the real
 *  data). Persian-digit change strings so no conversion is needed at render. */
export interface LandingCoin {
  sym: string;
  name: string;
  icon: string;
  ch: string;
  up: boolean;
}

/** The stars of the show — meme coins lead everywhere on the landing. */
export const MEME_COINS: LandingCoin[] = [
  { sym: "PEPE", name: "پپه", icon: "/coins/pepe.png", ch: "۲۸٫۱", up: true },
  {
    sym: "DOGE",
    name: "داگ‌کوین",
    icon: "/coins/doge.png",
    ch: "۲٫۱",
    up: false,
  },
  {
    sym: "WIF",
    name: "داگ‌ویف‌هت",
    icon: "/coins/wif.png",
    ch: "۴۲٫۳",
    up: true,
  },
  { sym: "BOME", name: "بوم", icon: "/coins/bome.png", ch: "۶۳٫۵", up: true },
  { sym: "MEW", name: "میو", icon: "/coins/mew.png", ch: "۱۵٫۲", up: true },
];

/** Meme coins + a few majors, for the scrolling marquee. */
export const ALL_COINS: LandingCoin[] = [
  ...MEME_COINS,
  { sym: "BTC", name: "بیت‌کوین", icon: "/coins/btc.png", ch: "۳٫۲", up: true },
  { sym: "ETH", name: "اتریوم", icon: "/coins/eth.png", ch: "۲٫۸", up: true },
  { sym: "SOL", name: "سولانا", icon: "/coins/sol.png", ch: "۱۴٫۵", up: true },
  { sym: "TON", name: "تون", icon: "/coins/ton.png", ch: "۳۶٫۷", up: true },
  {
    sym: "BNB",
    name: "بی‌ان‌بی",
    icon: "/coins/bnb.png",
    ch: "۱٫۹",
    up: false,
  },
];
