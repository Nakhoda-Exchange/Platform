import type { MarketRepository } from "@/lib/core/application/market/ports/market-repository.port";
import type { Coin } from "@/lib/core/domain/market/coin";
import type {
  ChartRange,
  CoinDetail,
  Candle,
  PricePoint,
} from "@/lib/core/domain/market/coin-detail";
import { ok, type Result } from "@/lib/core/domain/shared/result";
import {
  seededSeries,
  toCandles,
} from "@/lib/infrastructure/shared/seeded-series";

function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Canned market data (per-process). Swap for an HTTP adapter in the composition
// root when the backend lands. Icons live in public/coins/ (see scripts/generate-coin-icons.mjs).
// marketCap is in همت (هزار میلیارد تومان).
const COINS: Coin[] = [
  {
    id: "btc",
    name: "بیت‌کوین",
    symbol: "BTC",
    iconUrl: "/coins/btc.png",
    priceIrt: 3_900_000_000,
    priceUsd: 65_800,
    change24h: 3.2,
    marketCap: 85_000,
    isNew: false,
  },
  {
    id: "eth",
    name: "اتریوم",
    symbol: "ETH",
    iconUrl: "/coins/eth.png",
    priceIrt: 210_000_000,
    priceUsd: 3_500,
    change24h: 2.8,
    marketCap: 22_000,
    isNew: false,
  },
  {
    id: "usdt",
    name: "تتر",
    symbol: "USDT",
    iconUrl: "/coins/usdt.png",
    priceIrt: 59_800,
    priceUsd: 1,
    change24h: 0.1,
    marketCap: 7_200,
    isNew: false,
  },
  {
    id: "bnb",
    name: "بایننس‌کوین",
    symbol: "BNB",
    iconUrl: "/coins/bnb.png",
    priceIrt: 45_000_000,
    priceUsd: 720,
    change24h: -1.9,
    marketCap: 6_800,
    isNew: false,
  },
  {
    id: "sol",
    name: "سولانا",
    symbol: "SOL",
    iconUrl: "/coins/sol.png",
    priceIrt: 8_300_000,
    priceUsd: 138,
    change24h: 14.5,
    marketCap: 4_100,
    isNew: false,
  },
  {
    id: "xrp",
    name: "ریپل",
    symbol: "XRP",
    iconUrl: "/coins/xrp.png",
    priceIrt: 42_000,
    priceUsd: 0.62,
    change24h: 4.1,
    marketCap: 2_100,
    isNew: false,
  },
  {
    id: "ada",
    name: "کاردانو",
    symbol: "ADA",
    iconUrl: "/coins/ada.png",
    priceIrt: 38_000,
    priceUsd: 0.58,
    change24h: -1.2,
    marketCap: 1_300,
    isNew: false,
  },
  {
    id: "doge",
    name: "دوج‌کوین",
    symbol: "DOGE",
    iconUrl: "/coins/doge.png",
    priceIrt: 4_500,
    priceUsd: 0.07,
    change24h: -2.1,
    marketCap: 850,
    isNew: false,
  },
  {
    id: "ton",
    name: "تون‌کوین",
    symbol: "TON",
    iconUrl: "/coins/ton.png",
    priceIrt: 320_000,
    priceUsd: 5.3,
    change24h: 36.7,
    marketCap: 555,
    isNew: false,
  },
  {
    id: "pepe",
    name: "پپه",
    symbol: "PEPE",
    iconUrl: "/coins/pepe.png",
    priceIrt: 0.18,
    priceUsd: 0.0000028,
    change24h: 9.8,
    marketCap: 93,
    isNew: false,
    // Public mainnet token identities — DexScreener/RugCheck are keyless, so the
    // insights panels render live for these. Verify/replace Solana mints.
    token: {
      chain: "ethereum",
      address: "0x6982508145454ce325ddbe47a25d4ec3d2311933",
    },
  },
  {
    id: "wif",
    name: "داگ‌ویف‌هت",
    symbol: "WIF",
    iconUrl: "/coins/wif.png",
    priceIrt: 85_000,
    priceUsd: 1.3,
    change24h: 12.4,
    marketCap: 32,
    isNew: true,
    token: {
      chain: "solana",
      address: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    },
  },
  {
    id: "bome",
    name: "بوم",
    symbol: "BOME",
    iconUrl: "/coins/bome.png",
    priceIrt: 1_200,
    priceUsd: 0.018,
    change24h: 8.7,
    marketCap: 18,
    isNew: true,
    token: {
      chain: "solana",
      address: "ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ7tvT",
    },
  },
  {
    id: "mew",
    name: "میو",
    symbol: "MEW",
    iconUrl: "/coins/mew.png",
    priceIrt: 320,
    priceUsd: 0.005,
    change24h: 15.2,
    marketCap: 9,
    isNew: true,
    token: {
      chain: "solana",
      address: "MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUdj9CG",
    },
  },
  // More tradeable coins. No bundled logo yet → iconUrl "" so CoinIcon shows
  // the brand letter-badge fallback (add public/coins/<id>.png to give them a
  // real logo). listCoins() sorts by marketCap, so order here doesn't matter.
  {
    id: "trx",
    name: "ترون",
    symbol: "TRX",
    iconUrl: "",
    priceIrt: 7_800,
    priceUsd: 0.13,
    change24h: 2.4,
    marketCap: 1_150,
    isNew: false,
  },
  {
    id: "link",
    name: "چین‌لینک",
    symbol: "LINK",
    iconUrl: "",
    priceIrt: 840_000,
    priceUsd: 14,
    change24h: 5.1,
    marketCap: 820,
    isNew: false,
  },
  {
    id: "shib",
    name: "شیبا اینو",
    symbol: "SHIB",
    iconUrl: "",
    priceIrt: 1.08,
    priceUsd: 0.000018,
    change24h: 6.3,
    marketCap: 680,
    isNew: false,
  },
  {
    id: "dot",
    name: "پولکادات",
    symbol: "DOT",
    iconUrl: "",
    priceIrt: 389_000,
    priceUsd: 6.5,
    change24h: -1.4,
    marketCap: 640,
    isNew: false,
  },
  {
    id: "avax",
    name: "آوالانچ",
    symbol: "AVAX",
    iconUrl: "",
    priceIrt: 1_675_000,
    priceUsd: 28,
    change24h: 7.8,
    marketCap: 600,
    isNew: false,
  },
  {
    id: "ltc",
    name: "لایت‌کوین",
    symbol: "LTC",
    iconUrl: "",
    priceIrt: 4_186_000,
    priceUsd: 70,
    change24h: -0.6,
    marketCap: 470,
    isNew: false,
  },
  {
    id: "near",
    name: "نیر",
    symbol: "NEAR",
    iconUrl: "",
    priceIrt: 299_000,
    priceUsd: 5,
    change24h: 4.2,
    marketCap: 410,
    isNew: false,
  },
  {
    id: "icp",
    name: "اینترنت کامپیوتر",
    symbol: "ICP",
    iconUrl: "",
    priceIrt: 550_000,
    priceUsd: 9.2,
    change24h: -2.3,
    marketCap: 360,
    isNew: false,
  },
  {
    id: "uni",
    name: "یونی‌سواپ",
    symbol: "UNI",
    iconUrl: "",
    priceIrt: 478_000,
    priceUsd: 8,
    change24h: 3.5,
    marketCap: 310,
    isNew: false,
  },
  {
    id: "apt",
    name: "اپتوس",
    symbol: "APT",
    iconUrl: "",
    priceIrt: 538_000,
    priceUsd: 9,
    change24h: 1.9,
    marketCap: 285,
    isNew: false,
  },
  {
    id: "atom",
    name: "کازموس",
    symbol: "ATOM",
    iconUrl: "",
    priceIrt: 359_000,
    priceUsd: 6,
    change24h: -1.1,
    marketCap: 255,
    isNew: false,
  },
  {
    id: "sui",
    name: "سویی",
    symbol: "SUI",
    iconUrl: "",
    priceIrt: 66_000,
    priceUsd: 1.1,
    change24h: 11.2,
    marketCap: 235,
    isNew: false,
  },
  {
    id: "inj",
    name: "اینجکتیو",
    symbol: "INJ",
    iconUrl: "",
    priceIrt: 1_316_000,
    priceUsd: 22,
    change24h: 8.9,
    marketCap: 185,
    isNew: false,
  },
  {
    id: "fil",
    name: "فایل‌کوین",
    symbol: "FIL",
    iconUrl: "",
    priceIrt: 239_000,
    priceUsd: 4,
    change24h: 2.7,
    marketCap: 205,
    isNew: false,
  },
  {
    id: "arb",
    name: "آربیتروم",
    symbol: "ARB",
    iconUrl: "",
    priceIrt: 45_000,
    priceUsd: 0.75,
    change24h: -3.2,
    marketCap: 165,
    isNew: false,
  },
];

// Short Persian «about» blurbs for the well-known coins; others fall back to a
// generic line. Mock copy — swap for CMS/API content later.
const DESCRIPTIONS: Record<string, string> = {
  btc: "بیت‌کوین نخستین و شناخته‌شده‌ترین رمزارز جهان است که در سال ۲۰۰۹ معرفی شد و پایه‌ی بازار رمزارزها به شمار می‌رود.",
  eth: "اتریوم پلتفرمی برای قراردادهای هوشمند است و بستر بسیاری از پروژه‌های غیرمتمرکز و توکن‌ها روی آن ساخته شده است.",
  usdt: "تتر یک استیبل‌کوین است که ارزش آن به دلار آمریکا وابسته است و برای حفظ ارزش و نقل‌وانتقال سریع کاربرد دارد.",
  sol: "سولانا یک شبکه‌ی بلاک‌چینی سریع و کم‌هزینه است که برای اپلیکیشن‌های غیرمتمرکز و توکن‌های پرکاربرد شناخته می‌شود.",
};

export class MockMarketRepository implements MarketRepository {
  async listCoins(): Promise<Result<Coin[]>> {
    await delay();
    // «همه ارزها» reads in market-cap order; sort here so the source array can
    // stay unordered as coins are added.
    return ok([...COINS].sort((a, b) => b.marketCap - a.marketCap));
  }

  async getCoinDetail(idOrSymbol: string): Promise<Result<CoinDetail | null>> {
    await delay();
    const key = idOrSymbol.toLowerCase();
    const coin = COINS.find(
      (c) => c.id === key || c.symbol.toLowerCase() === key,
    );
    if (!coin) return ok(null);

    const seed = [...coin.symbol].reduce((a, c) => a + c.charCodeAt(0), 0);
    const d = coin.change24h / 100;
    const end = Date.now();
    const toPoints = (values: number[], stepMs: number): PricePoint[] =>
      values.map((v, i) => ({
        at: end - (values.length - 1 - i) * stepMs,
        priceIrt: v,
      }));
    const series: Record<ChartRange, PricePoint[]> = {
      "24h": toPoints(seededSeries(seed + 1, 24, coin.priceIrt, d), 3_600_000),
      "7d": toPoints(
        seededSeries(seed + 7, 28, coin.priceIrt, d * 1.8),
        21_600_000,
      ),
      "1m": toPoints(
        seededSeries(seed + 30, 30, coin.priceIrt, d * 3),
        86_400_000,
      ),
      "1y": toPoints(
        seededSeries(seed + 365, 24, coin.priceIrt, d * 6),
        1_314_900_000, // ~15.2 days: 24 points spanning a year
      ),
    };
    // Candles: the same walks at 4× resolution, bucketed into OHLC — the
    // last close pins to the live price like the line series does.
    const toRangeCandles = (
      rangeSeed: number,
      count: number,
      drift: number,
      stepMs: number,
    ): Candle[] =>
      toCandles(
        seededSeries(rangeSeed, count * 4, coin.priceIrt, drift),
        4,
      ).map((c, i) => ({ at: end - (count - 1 - i) * stepMs, ...c }));
    const candles: Record<ChartRange, Candle[]> = {
      "24h": toRangeCandles(seed + 1, 24, d, 3_600_000),
      "7d": toRangeCandles(seed + 7, 28, d * 1.8, 21_600_000),
      "1m": toRangeCandles(seed + 30, 30, d * 3, 86_400_000),
      "1y": toRangeCandles(seed + 365, 24, d * 6, 1_314_900_000),
    };

    const prices24 = series["24h"].map((p) => p.priceIrt);

    // Mock-only stubs — a real backend replaces these. Seeded so a coin's
    // numbers/articles stay stable between loads.
    const holders = 8_000 + (seed % 120) * 750 + Math.round(coin.marketCap * 9);
    const day = 86_400_000;
    const blogPosts = [
      {
        id: `${coin.id}-weekly`,
        title: `تحلیل هفتگی ${coin.name}`,
        excerpt: `مرور روند قیمت ${coin.symbol} و سطوح مهم پیش رو.`,
        source: "بلاگ ناخدا",
        publishedAt: end - 2 * day,
      },
      {
        id: `${coin.id}-guide`,
        title: `${coin.name} چیست و چطور بخریم؟`,
        excerpt: `راهنمای ساده برای آشنایی و خرید ${coin.name} در ناخدا.`,
        source: "بلاگ ناخدا",
        publishedAt: end - 9 * day,
      },
      {
        id: `${coin.id}-onchain`,
        title: `نگاهی به آمار آن‌چین ${coin.symbol}`,
        excerpt: `چه چیزی در شبکه ${coin.name} در حال رخ دادن است؟`,
        source: "بلاگ ناخدا",
        publishedAt: end - 20 * day,
      },
    ];

    return ok({
      coin,
      high24h: Math.max(...prices24),
      low24h: Math.min(...prices24),
      volume24h: Math.round(coin.marketCap * 0.6) / 10, // همت, ~6% of market cap
      holders,
      description:
        DESCRIPTIONS[coin.id] ??
        `${coin.name} (${coin.symbol}) یکی از رمزارزهای قابل معامله در ناخداست. قیمت لحظه‌ای و نمودار آن را اینجا دنبال کنید.`,
      history: `${coin.name} از زمان عرضه تاکنون یکی از رمزارزهای شناخته‌شده بازار بوده و در سال‌های اخیر توجه معامله‌گران ایرانی را به خود جلب کرده است. آن‌چه در این صفحه می‌بینید تنها برای آشناییست و توصیه‌ی معاملاتی نیست.`,
      blogPosts,
      series,
      candles,
    });
  }
}
